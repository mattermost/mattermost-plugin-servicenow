package plugin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
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
					Type:               constants.SubscriptionTypeRecord,
					Number:             mockNumber,
					ChannelID:          mockChannelID,
					UserName:           mockUser,
					ShortDescription:   mockDescription,
					RecordType:         constants.RecordTypeIncident,
					SubscriptionEvents: constants.SubscriptionEventState,
				},
				{
					SysID:              mockSysID,
					Type:               constants.SubscriptionTypeBulk,
					ChannelID:          mockChannelID,
					UserName:           mockUser,
					RecordType:         constants.RecordTypeIncident,
					SubscriptionEvents: constants.SubscriptionEventState,
				},
			},
			expectedResult: "#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel |\n| :----|:--------| :--------|:--------|:--------|\n|mockSysID|Incident|State changed|mockUser||\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|mockSysID|Incident|mockNumber|mockDescription|State changed|mockUser||",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)

			resp := ParseSubscriptionsToCommandResponse(testCase.subscripitons)
			assert.EqualValues(testCase.expectedResult, resp)
		})
	}
}

func TestIsAuthorizedSysAdmin(t *testing.T) {
	defer monkey.UnpatchAll()
	for _, testCase := range []struct {
		description string
		setupAPI    func(api *plugintest.API) *plugintest.API
		expectedErr bool
		isAdmin     bool
	}{
		{
			description: "IsAuthorizedSysAdmin: with admin",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetUser", testutils.GetID()).Return(&model.User{
					Roles: model.SYSTEM_ADMIN_ROLE_ID,
				}, nil)
				return api
			},
			isAdmin: true,
		},
		{
			description: "IsAuthorizedSysAdmin: with normal user",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetUser", testutils.GetID()).Return(&model.User{}, nil)
				return api
			},
		},
		{
			description: "IsAuthorizedSysAdmin: error while getting user",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetUser", testutils.GetID()).Return(nil, testutils.GetInternalServerAppError())
				return api
			},
			expectedErr: true,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			api := testCase.setupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)

			p := setupTestPlugin(api, nil)
			isAdmin, err := p.isAuthorizedSysAdmin(testutils.GetID())

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
					return nil, errors.New("mockError")
				})
			},
			expectedErr: "mockError",
		},
		{
			description: "ConvertSubscriptionToMap: unmarshalling gives error",
			setupPlugin: func() {
				monkey.Patch(json.Marshal, func(interface{}) ([]byte, error) {
					return []byte("mockData"), nil
				})
				monkey.Patch(json.Unmarshal, func([]byte, interface{}) error {
					return errors.New("mockError")
				})
			},
			expectedErr: "mockError",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			testCase.setupPlugin()

			resp, err := ConvertSubscriptionToMap(&serializer.SubscriptionResponse{
				Type: constants.SubscriptionTypeBulk,
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
					Type: constants.SubscriptionTypeRecord,
				},
				{
					Type: constants.SubscriptionTypeBulk,
				},
				{
					Type:             constants.SubscriptionTypeRecord,
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
		setupAPI           func(api *plugintest.API) *plugintest.API
		setupPlugin        func()
		errorMessage       error
		expectedResponse   string
		expectedStatusCode int
	}{
		{
			description: "handleClientError",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			setupPlugin:        func() {},
			errorMessage:       errors.New("mockError"),
			expectedResponse:   genericErrorMessage,
			expectedStatusCode: http.StatusInternalServerError,
		},
		{
			description: "handleClientError: with token not fetched",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			setupPlugin: func() {
				var p *Plugin
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "DisconnectUser", func(*Plugin, string) error {
					return nil
				})
			},
			errorMessage:       errors.New("oauth2: cannot fetch token: 401 Unauthorized"),
			expectedResponse:   "",
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description: "handleClientError: with token not fetched and disconnect error",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string")).Return()
				return api
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
			description: "handleClientError: with subscriptions not configured",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDSubscriptionsNotConfigured),
			expectedResponse:   "",
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description: "handleClientError: with update set not uploaded",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDLatestUpdateSetNotUploaded),
			expectedResponse:   constants.APIErrorIDLatestUpdateSetNotUploaded,
			expectedStatusCode: http.StatusBadRequest,
		},
		{
			description: "handleClientError: with subscriptions not authorized",
			setupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			setupPlugin:        func() {},
			errorMessage:       errors.New(constants.APIErrorIDSubscriptionsNotAuthorized),
			expectedResponse:   "",
			expectedStatusCode: http.StatusUnauthorized,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			api := testCase.setupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)

			p := setupTestPlugin(api, nil)
			testCase.setupPlugin()
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, requestURL, nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			response := p.handleClientError(w, r, testCase.errorMessage, true, 0, testutils.GetID(), "")

			assert.EqualValues(testCase.expectedResponse, response)
			assert.EqualValues(testCase.expectedStatusCode, w.Result().StatusCode)
		})
	}
}
