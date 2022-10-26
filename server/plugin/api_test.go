package plugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	mock_plugin "github.com/Brightscout/mattermost-plugin-servicenow/server/mocks"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

func setupTestPlugin(api *plugintest.API, store *mock_plugin.Store) *Plugin {
	p := &Plugin{}
	p.setConfiguration(&configuration{
		WebhookSecret: testutils.GetSecret(),
	})

	path, _ := filepath.Abs("../..")
	api.On("GetBundlePath").Return(path, nil)
	p.SetAPI(api)
	if store != nil {
		p.store = store
	}
	p.router = p.InitAPI()
	return p
}

func setupPluginForCheckOAuthMiddleware(p *Plugin, t *testing.T) *mock_plugin.Client {
	monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
		return testutils.GetSerializerUser(), nil
	})

	monkey.PatchInstanceMethod(reflect.TypeOf(p), "ParseAuthToken", func(_ *Plugin, _ string) (*oauth2.Token, error) {
		return nil, nil
	})

	client := mock_plugin.NewClient(t)
	monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetClientFromRequest", func(_ *Plugin, _ *http.Request) Client {
		return client
	})

	return client
}

func setupPluginForSubscriptionsConfiguredMiddleware(p *Plugin, t *testing.T) *mock_plugin.Client {
	client := setupPluginForCheckOAuthMiddleware(p, t)
	client.On("ActivateSubscriptions").Return(0, nil)
	return client
}

func TestGetConnected(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetConnected)
	requestMethod := http.MethodGet
	for name, test := range map[string]struct {
		SetupStore         func(*mock_plugin.Store) *mock_plugin.Store
		ExpectedStatusCode int
		ExpectedValue      bool
	}{
		"user connected": {
			SetupStore: func(s *mock_plugin.Store) *mock_plugin.Store {
				s.On("LoadUser", testutils.GetID()).Return(nil, nil)
				return s
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedValue:      true,
		},
		"user not connected": {
			SetupStore: func(s *mock_plugin.Store) *mock_plugin.Store {
				s.On("LoadUser", testutils.GetID()).Return(nil, fmt.Errorf("test error"))
				return s
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedValue:      false,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			store := test.SetupStore(mock_plugin.NewStore(t))

			p := setupTestPlugin(&plugintest.API{}, store)
			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, requestURL, nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			var cr *serializer.ConnectedResponse
			err := json.NewDecoder(result.Body).Decode(&cr)
			require.Nil(t, err)

			assert.Equal(test.ExpectedValue, cr.Connected)
		})
	}
}

func TestGetUserChannelsForTeam(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetUserChannelsForTeam)
	requestMethod := http.MethodGet
	for name, test := range map[string]struct {
		TeamID               string
		SetupAPI             func(*plugintest.API) *plugintest.API
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(testutils.GetChannels(3, model.CHANNEL_PRIVATE), nil)
				return api
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      3,
		},
		"invalid team id": {
			TeamID: "testTeamID",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", constants.ErrorInvalidTeamID).Return()
				return api
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.ErrorInvalidTeamID,
		},
		"failed to get channels": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(nil, testutils.GetBadRequestAppError())
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			ExpectedStatusCode: http.StatusBadRequest,
			ExpectedCount:      -1,
		},
		"no channels present": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(nil, nil)
				return api
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
		"no public or private channels present": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(testutils.GetChannels(3, model.CHANNEL_DIRECT), nil)
				return api
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)

			p := setupTestPlugin(api, nil)
			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, strings.Replace(requestURL, "{team_id:[A-Za-z0-9]+}", test.TeamID, 1), nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)

			if test.ExpectedCount != -1 {
				var channels []*model.Channel
				err := json.NewDecoder(result.Body).Decode(&channels)
				require.Nil(t, err)

				assert.Equal(test.ExpectedCount, len(channels))
			}

			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Equal(test.ExpectedErrorMessage, resp.Message)
			}
		})
	}
}

func TestAPISearchRecordsInServiceNow(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathSearchRecords)
	requestMethod := http.MethodGet
	limit, offset := testutils.GetLimitAndOffset()
	for name, test := range map[string]struct {
		RecordType           string
		SearchTerm           string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(true),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("SearchRecordsInServiceNow", constants.RecordTypeIncident, testutils.GetSearchTerm(true), limit, offset).Return(
					testutils.GetServiceNowPartialRecords(3), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      3,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"invalid search term": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(false),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: fmt.Sprintf("The search term must be at least %d characters long.", constants.CharacterThresholdForSearchingRecords),
		},
		"failed to get records": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(true),
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...)
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("SearchRecordsInServiceNow", constants.RecordTypeIncident, testutils.GetSearchTerm(true), limit, offset).Return(
					nil, http.StatusForbidden, fmt.Errorf("new error"),
				)
			},
			ExpectedStatusCode: http.StatusForbidden,
			ExpectedCount:      -1,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			w := httptest.NewRecorder()
			queryParams := url.Values{
				constants.QueryParamSearchTerm: {test.SearchTerm},
			}
			r := httptest.NewRequest(requestMethod, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
			r.URL.RawQuery = queryParams.Encode()
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)

			if test.ExpectedCount != -1 {
				var channels []*model.Channel
				err := json.NewDecoder(result.Body).Decode(&channels)
				require.Nil(t, err)

				assert.Equal(test.ExpectedCount, len(channels))
			}

			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Equal(test.ExpectedErrorMessage, resp.Message)
			}
		})
	}
}

func TestGetRecordFromServiceNow(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetSingleRecord)
	requestURL = strings.Replace(requestURL, "{record_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1)
	requestMethod := http.MethodGet
	for name, test := range map[string]struct {
		RecordType           string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"failed to get record": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...)
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					nil, http.StatusForbidden, fmt.Errorf("new error"),
				)
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "new error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestHandleNotification(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathProcessNotification)
	requestMethod := http.MethodPost
	for name, test := range map[string]struct {
		RequestBody        string
		SetupAPI           func(*plugintest.API) *plugintest.API
		ExpectedStatusCode int
	}{
		"success": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(nil, nil)
				return api
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"failed to create post": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(nil, testutils.GetBadRequestAppError())
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			ExpectedStatusCode: http.StatusOK,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)

			p := setupTestPlugin(api, nil)

			w := httptest.NewRecorder()
			queryParams := url.Values{
				"secret": {testutils.GetSecret()},
			}
			r := httptest.NewRequest(requestMethod, requestURL, bytes.NewBufferString(test.RequestBody))
			r.URL.RawQuery = queryParams.Encode()
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
		})
	}
}

func TestCreateSubscription(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCreateSubscription)
	requestMethod := http.MethodPost
	for name, test := range map[string]struct {
		RequestBody          string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusOK, nil,
				)

				client.On("CreateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusCreated, nil,
				)

				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})
			},
			ExpectedStatusCode: http.StatusCreated,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"invalid subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return fmt.Errorf("new error")
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "new error",
		},
		"failed to check duplicate subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusForbidden, fmt.Errorf("duplicate subscription error"),
				)

				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "duplicate subscription error",
		},
		"duplicate subscription exists": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					true, http.StatusOK, nil,
				)

				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "Subscription already exists",
		},
		"failed to create subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusOK, nil,
				)

				client.On("CreateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusForbidden, fmt.Errorf("create subscription error"),
				)

				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "create subscription error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, requestURL, bytes.NewBufferString(test.RequestBody))
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestGetAllSubscriptions(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetAllSubscriptions)
	requestMethod := http.MethodGet
	limit, offset := testutils.GetLimitAndOffset()
	for name, test := range map[string]struct {
		ChannelID            string
		UserID               string
		SubscriptionType     string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
		ExpectedCount        int
	}{
		"success": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					testutils.GetSubscriptions(4), http.StatusOK, nil,
				)

				client.On("GetRecordFromServiceNow", constants.RecordTypeProblem, "").Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      4,
		},
		"invalid channel id": {
			ChannelID: "testChannelID",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamChannelID).Return()
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamChannelID,
		},
		"invalid user id": {
			UserID: "testUserID",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamUserID).Return()
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamUserID,
		},
		"invalid subscription type": {
			SubscriptionType: "testSubscriptionType",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamSubscriptionType).Return()
				return api
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamSubscriptionType,
		},
		"failed to get subscriptions": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "get subscriptions error").Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					nil, http.StatusForbidden, fmt.Errorf("get subscriptions error"),
				)
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedCount:        -1,
			ExpectedErrorMessage: "get subscriptions error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			queryParams := url.Values{
				constants.QueryParamChannelID:        {test.ChannelID},
				constants.QueryParamUserID:           {test.UserID},
				constants.QueryParamSubscriptionType: {test.SubscriptionType},
			}
			r := httptest.NewRequest(requestMethod, requestURL, nil)
			r.URL.RawQuery = queryParams.Encode()
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)

			if test.ExpectedCount != -1 {
				var subscripitons []*serializer.SubscriptionResponse
				err := json.NewDecoder(result.Body).Decode(&subscripitons)
				require.Nil(t, err)

				assert.Equal(test.ExpectedCount, len(subscripitons))
			}

			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestDeleteSubscription(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathDeleteSubscription)
	requestMethod := http.MethodDelete
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", testutils.GetServiceNowSysID()).Return(
					http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"failed to delete subscription": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "subscriptionID", testutils.GetServiceNowSysID(), "Error", "delete subscription error").Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", testutils.GetServiceNowSysID()).Return(
					http.StatusBadRequest, fmt.Errorf("delete subscription error"),
				)
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "delete subscription error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, strings.Replace(requestURL, "{subscription_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1), nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestEditSubscription(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathEditSubscription)
	requestMethod := http.MethodPatch
	for name, test := range map[string]struct {
		RequestBody          string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				client.On("EditSubscription", testutils.GetServiceNowSysID(), mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				return api
			},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"invalid subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "new error").Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return fmt.Errorf("new error")
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "new error",
		},
		"failed to edit subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "subscriptionID", testutils.GetServiceNowSysID(), "Error", "edit subscription error").Return()
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})
				client.On("EditSubscription", testutils.GetServiceNowSysID(), mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusForbidden, fmt.Errorf("edit subscription error"),
				)
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "edit subscription error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, strings.Replace(requestURL, "{subscription_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1), bytes.NewBufferString(test.RequestBody))
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestCheckAuth(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathOAuth2Connect)
	requestMethod := http.MethodGet
	t.Run("user id not present", func(t *testing.T) {
		assert := assert.New(t)
		p := setupTestPlugin(&plugintest.API{}, nil)
		w := httptest.NewRecorder()
		r := httptest.NewRequest(requestMethod, requestURL, nil)
		p.ServeHTTP(nil, w, r)

		result := w.Result()
		require.NotNil(t, result)
		defer result.Body.Close()

		assert.Equal(http.StatusUnauthorized, result.StatusCode)
		var resp *serializer.APIErrorResponse
		err := json.NewDecoder(result.Body).Decode(&resp)
		require.Nil(t, err)

		assert.Contains(resp.Message, constants.ErrorNotAuthorized)
	})
}

func TestCheckOAuth(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetSingleRecord)
	requestURL = strings.Replace(requestURL, "{record_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1)
	requestMethod := http.MethodGet
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"user not connected": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
					return nil, ErrNotFound
				})
			},
			ExpectedStatusCode:   http.StatusUnauthorized,
			ExpectedErrorMessage: constants.APIErrorNotConnected,
		},
		"failed to get user": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "get user error")
				return api
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
					return nil, fmt.Errorf("get user error")
				})
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "get user error",
		},
		"failed to parse auth token": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "token error")
				return api
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "ParseAuthToken", func(_ *Plugin, _ string) (*oauth2.Token, error) {
					return nil, fmt.Errorf("token error")
				})
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "token error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			test.SetupPlugin(p)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, requestURL, nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}

func TestCheckSubscriptionsConfigured(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCreateSubscription)
	requestMethod := http.MethodPost
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"subscriptions not configured": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("ActivateSubscriptions").Return(0, fmt.Errorf(constants.APIErrorIDSubscriptionsNotConfigured))
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.APIErrorSubscriptionsNotConfigured,
		},
		"subscriptions not authorized": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("ActivateSubscriptions").Return(0, fmt.Errorf(constants.APIErrorIDSubscriptionsNotAuthorized))
			},
			ExpectedStatusCode:   http.StatusUnauthorized,
			ExpectedErrorMessage: constants.APIErrorSubscriptionsNotAuthorized,
		},
		"failed to check or activate subscriptions": {
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "generic error")
				return api
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("ActivateSubscriptions").Return(0, fmt.Errorf("generic error"))
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "generic error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(requestMethod, requestURL, nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)
			if test.ExpectedErrorMessage != "" {
				var resp *serializer.APIErrorResponse
				err := json.NewDecoder(result.Body).Decode(&resp)
				require.Nil(t, err)

				assert.Contains(resp.Message, test.ExpectedErrorMessage)
			}
		})
	}
}
