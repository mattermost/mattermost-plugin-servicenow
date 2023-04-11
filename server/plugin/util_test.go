package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	mock_plugin "github.com/mattermost/mattermost-plugin-servicenow/server/mocks"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
)

func TestParseSubscriptionsToCommandResponse(t *testing.T) {
	defer monkey.UnpatchAll()
	mockSysID := "mockSysID"
	mockNumber := "mockNumber"
	mockChannelID := "mockChannelID"
	mockUser := "mockUser"
	mockDescription := "mockDescription"
	for _, testCase := range []struct {
		description    string
		subscripitons  []*serializer.SubscriptionResponse
		expectedResult string
	}{
		{
			description: "ParseSubscriptionsToCommandResponse",
			subscripitons: []*serializer.SubscriptionResponse{
				{
					SysID:              mockSysID,
					Type:               testutils.GetRecordTypeSubscription(),
					Number:             mockNumber,
					ChannelID:          mockChannelID,
					UserName:           mockUser,
					ShortDescription:   mockDescription,
					RecordType:         constants.RecordTypeIncident,
					SubscriptionEvents: constants.SubscriptionEventState,
				},
				{
					SysID:              mockSysID,
					Type:               testutils.GetBulkTypeSubscription(),
					ChannelID:          mockChannelID,
					UserName:           mockUser,
					RecordType:         constants.RecordTypeIncident,
					SubscriptionEvents: constants.SubscriptionEventState,
				},
			},
			expectedResult: "#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel | Filters | \n| :----|:--------| :--------|:--------|:--------|:---------|\n|mockSysID|Incident|State changed|mockUser||N/A|\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|mockSysID|Incident|mockNumber|mockDescription|State changed|mockUser||",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			resp := ParseSubscriptionsToCommandResponse(testCase.subscripitons)
			assert.EqualValues(testCase.expectedResult, resp)
		})
	}
}

func TestGetFiltersFromServiceNow(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description  string
		subscription *serializer.SubscriptionResponse
		setupAPI     func(api *plugintest.API)
		setupClient  func(client *mock_plugin.Client)
	}{
		{
			description:  "GetFiltersFromServiceNow: with no filters",
			subscription: testutils.GetSubscription(constants.SubscriptionTypeRecord, false),
			setupAPI:     func(api *plugintest.API) {},
			setupClient:  func(client *mock_plugin.Client) {},
		},
		{
			description:  "GetFiltersFromServiceNow: with all filters",
			subscription: testutils.GetSubscription(constants.SubscriptionTypeBulk, true),
			setupAPI:     func(api *plugintest.API) {},
			setupClient: func(client *mock_plugin.Client) {
				client.On("SearchFilterValuesInServiceNow", testutils.GetMockArgumentsWithType("string", 4)...).Twice().Return(
					testutils.GetServiceNowFilterValues(1), http.StatusOK, nil,
				)
			},
		},
		{
			description:  "GetFiltersFromServiceNow: error in searching filter values",
			subscription: testutils.GetSubscription(constants.SubscriptionTypeBulk, true),
			setupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Once()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("SearchFilterValuesInServiceNow", testutils.GetMockArgumentsWithType("string", 4)...).Once().Return(
					nil, http.StatusInternalServerError, fmt.Errorf("failed to get the filter values"),
				)
			},
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			testCase.setupClient(client)
			testCase.setupAPI(api)
			defer api.AssertExpectations(t)
			p.GetFiltersFromServiceNow(testCase.subscription, client, nil, true)
		})
	}
}

func TestIsAuthorizedSysAdmin(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description string
		setupAPI    func(api *plugintest.API)
		expectedErr bool
		isAdmin     bool
	}{
		{
			description: "IsAuthorizedSysAdmin: with admin",
			setupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SYSTEM_ADMIN_ROLE_ID), nil,
				)
			},
			isAdmin: true,
		},
		{
			description: "IsAuthorizedSysAdmin: with normal user",
			setupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SYSTEM_USER_ROLE_ID), nil,
				)
			},
		},
		{
			description: "IsAuthorizedSysAdmin: error while getting user",
			setupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					nil, testutils.GetInternalServerAppError(""),
				)
			},
			expectedErr: true,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			testCase.setupAPI(api)
			defer api.AssertExpectations(t)

			isAdmin, err := p.IsAuthorizedSysAdmin(testutils.GetID())

			if testCase.expectedErr {
				assert.NotNil(err)
			} else {
				assert.Nil(err)
			}

			assert.EqualValues(testCase.isAdmin, isAdmin)
		})
	}
}

func TestConvertSubscriptionToMap(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description string
		setupPlugin func()
		expectedErr string
	}{
		{
			description: "ConvertSubscriptionToMap: valid",
			setupPlugin: func() {
				monkey.Patch(json.Marshal, func(interface{}) ([]byte, error) {
					return []byte("mockData"), nil
				})
				monkey.Patch(json.Unmarshal, func([]byte, interface{}) error {
					return nil
				})
			},
		},
		{
			description: "ConvertSubscriptionToMap: marshaling gives error",
			setupPlugin: func() {
				monkey.Patch(json.Marshal, func(interface{}) ([]byte, error) {
					return nil, errors.New("error while marshaling")
				})
			},
			expectedErr: "error while marshaling",
		},
		{
			description: "ConvertSubscriptionToMap: unmarshalling gives error",
			setupPlugin: func() {
				monkey.Patch(json.Marshal, func(interface{}) ([]byte, error) {
					return []byte("mockData"), nil
				})
				monkey.Patch(json.Unmarshal, func([]byte, interface{}) error {
					return errors.New("error while unmarshalling")
				})
			},
			expectedErr: "error while unmarshalling",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			testCase.setupPlugin()

			resp, err := ConvertSubscriptionToMap(&serializer.SubscriptionResponse{
				Type: testutils.GetBulkTypeSubscription(),
			})

			if testCase.expectedErr != "" {
				assert.EqualValues(testCase.expectedErr, err.Error())
				assert.Nil(resp)
				return
			}

			assert.Nil(err)
		})
	}
}

func TestFilterSubscriptionsOnRecordData(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description   string
		subscripitons []*serializer.SubscriptionResponse
		expectedCount int
	}{
		{
			description: "FilterSubscriptionsOnRecordData",
			subscripitons: []*serializer.SubscriptionResponse{
				{
					Type: testutils.GetRecordTypeSubscription(),
				},
				{
					Type: testutils.GetBulkTypeSubscription(),
				},
				{
					Type:             testutils.GetRecordTypeSubscription(),
					ShortDescription: "mockDescription",
					Number:           "mockNumber",
				},
			},
			expectedCount: 2,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			resp := FilterSubscriptionsOnRecordData(testCase.subscripitons)
			assert.EqualValues(testCase.expectedCount, len(resp))
		})
	}
}

func TestHandleClientError(t *testing.T) {
	defer monkey.UnpatchAll()
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCreateSubscription)
	for _, testCase := range []struct {
		description        string
		setupAPI           func(api *plugintest.API)
		setupPlugin        func()
		statusCode         int
		errorMessage       error
		expectedResponse   string
		expectedStatusCode int
	}{
		{
			description:        "handleClientError",
			setupAPI:           func(api *plugintest.API) {},
			setupPlugin:        func() {},
			errorMessage:       errors.New("handle client error"),
			expectedResponse:   genericErrorMessage,
			expectedStatusCode: http.StatusInternalServerError,
		},
		{
			description: "handleClientError: with token not fetched",
			setupAPI:    func(api *plugintest.API) {},
			setupPlugin: func() {
				var p *Plugin
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "DisconnectUser", func(*Plugin, string) error {
					return nil
				})
			},
			errorMessage:       errors.New("oauth2: cannot fetch token: 401 Unauthorized"),
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description: "handleClientError: with token not fetched and disconnect error",
			setupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string")).Return()
			},
			setupPlugin: func() {
				var p *Plugin
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "DisconnectUser", func(*Plugin, string) error {
					return errors.New("disconnect user error")
				})
			},
			errorMessage:       errors.New("oauth2: cannot fetch token: 401 Unauthorized"),
			expectedResponse:   genericErrorMessage,
			expectedStatusCode: http.StatusInternalServerError,
		},
		{
			description:        "handleClientError: with subscriptions not configured",
			setupAPI:           func(api *plugintest.API) {},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDSubscriptionsNotConfigured),
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description:        "handleClientError: with latest update set not uploaded",
			setupAPI:           func(api *plugintest.API) {},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDLatestUpdateSetNotUploaded),
			expectedResponse:   constants.APIErrorIDLatestUpdateSetNotUploaded,
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description:        "handleClientError: with subscriptions not authorized",
			setupAPI:           func(api *plugintest.API) {},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDSubscriptionsNotAuthorized),
			expectedStatusCode: http.StatusUnauthorized,
		},
		{
			description:        "handleClientError: with status not found and err: ACL restricts the record retrieval",
			setupAPI:           func(api *plugintest.API) {},
			setupPlugin:        func() {},
			statusCode:         http.StatusNotFound,
			errorMessage:       errors.New(constants.ErrorACLRestrictsRecordRetrieval),
			expectedStatusCode: http.StatusUnauthorized,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			testCase.setupAPI(api)
			defer api.AssertExpectations(t)

			testCase.setupPlugin()
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, requestURL, nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			response := p.handleClientError(w, r, testCase.errorMessage, true, testCase.statusCode, testutils.GetID(), "")

			assert.EqualValues(testCase.expectedResponse, response)
			assert.EqualValues(testCase.expectedStatusCode, w.Result().StatusCode)
		})
	}
}

func TestIsValidUserKey(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description      string
		testKey          string
		expectedKey      string
		expectedResponse bool
	}{
		{
			description:      "IsValidUserKey: valid key",
			testKey:          "user_mockKey",
			expectedKey:      "mockKey",
			expectedResponse: true,
		},
		{
			description: "IsValidUserKey: invalid key",
			testKey:     "mockKey",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			resp, isValid := IsValidUserKey(testCase.testKey)

			assert.EqualValues(testCase.expectedKey, resp)
			assert.EqualValues(testCase.expectedResponse, isValid)
		})
	}
}

func TestDecodeKey(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description string
		testKey     string
		expectedKey string
		expectedErr error
	}{
		{
			description: "DecodeKey: success",
			testKey:     "bW9ja0tleQ==",
			expectedKey: "mockKey",
		},
		{
			description: "DecodeKey: empty key",
		},
		{
			description: "DecodeKey: error in decoding",
			testKey:     "invalidKey",
			expectedErr: errors.New("illegal base64 data at input byte 8"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			resp, err := decodeKey(testCase.testKey)

			if testCase.expectedErr != nil {
				assert.Error(err, testCase.expectedErr)
			} else {
				assert.Nil(err)
			}

			assert.EqualValues(testCase.expectedKey, resp)
		})
	}
}

func TestHasChannelPermissions(t *testing.T) {
	for _, testCase := range []struct {
		description  string
		setupAPI     func(api *plugintest.API)
		statusCode   int
		errorMessage string
	}{
		{
			description: "HasChannelPermissions: user has channel permissions",
			setupAPI: func(api *plugintest.API) {
				api.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_OPEN), nil,
				)
				api.On("GetChannelMember", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					nil, nil,
				)
			},
			statusCode: http.StatusOK,
		},
		{
			description: "HasChannelPermissions: unable to get channel",
			setupAPI: func(api *plugintest.API) {
				api.On("GetChannel", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError("unable to get channel"),
				)
				api.On("LogDebug", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			statusCode:   http.StatusInternalServerError,
			errorMessage: constants.ErrorChannelPermissionsForUser,
		},
		{
			description: "HasChannelPermissions: channel is a direct channel",
			setupAPI: func(api *plugintest.API) {
				api.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_DIRECT), nil,
				)
			},
			statusCode:   http.StatusBadRequest,
			errorMessage: constants.ErrorInvalidChannelType,
		},
		{
			description: "HasChannelPermissions: unable to check if a user is part of the channel",
			setupAPI: func(api *plugintest.API) {
				api.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_OPEN), nil,
				)
				api.On("GetChannelMember", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					nil, testutils.GetInternalServerAppError("unable to check if a user is part of the channel"),
				)
				api.On("LogDebug", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			statusCode:   http.StatusInternalServerError,
			errorMessage: constants.ErrorInsufficientPermissions,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			testCase.setupAPI(api)
			defer api.AssertExpectations(t)

			statusCode, _, err := p.HasChannelPermissions(testutils.GetID(), testutils.GetChannelID(), true)
			if testCase.errorMessage != "" {
				assert.EqualError(err, testCase.errorMessage)
			} else {
				assert.Nil(err)
			}

			assert.EqualValues(testCase.statusCode, statusCode)
		})
	}
}
