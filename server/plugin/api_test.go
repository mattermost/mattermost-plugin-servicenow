package plugin

import (
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
			TeamID: "dfs",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", "Invalid team id").Return()
				return api
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: "Invalid team id",
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

func TestSearchRecordsInServiceNow(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathSearchRecords)
	requestMethod := http.MethodGet
	limit, offset := testutils.GetLimitAndOffset()
	for name, test := range map[string]struct {
		RecordType           string
		SearchTerm           string
		SetupAPI             func(*plugintest.API) *plugintest.API
		SetupClient          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.SubscriptionRecordTypeIncident,
			SearchTerm: "server",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetClientFromRequest", func(_ *Plugin, _ *http.Request) Client {
					client := mock_plugin.NewClient(t)
					client.On("SearchRecordsInServiceNow", constants.SubscriptionRecordTypeIncident, "server", limit, offset).Return(
						testutils.GetServiceNowPartialRecords(3), http.StatusOK, nil,
					)
					return client
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      3,
		},
		"invalid record type": {
			RecordType: "wrong",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "wrong").Return()
				return api
			},
			SetupClient:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: "Invalid record type",
		},
		"invalid search term": {
			RecordType: constants.SubscriptionRecordTypeIncident,
			SearchTerm: "sdf",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: "The search term must be at least 4 characters long.",
		},
		"failed to get records": {
			RecordType: constants.SubscriptionRecordTypeIncident,
			SearchTerm: "server",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...)
				return api
			},
			SetupClient: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetClientFromRequest", func(_ *Plugin, _ *http.Request) Client {
					client := mock_plugin.NewClient(t)
					client.On("SearchRecordsInServiceNow", constants.SubscriptionRecordTypeIncident, "server", limit, offset).Return(
						nil, http.StatusForbidden, fmt.Errorf("new error"),
					)
					return client
				})
			},
			ExpectedStatusCode: http.StatusForbidden,
			ExpectedCount:      -1,
		},
		"failed to marshal records": {
			RecordType: constants.SubscriptionRecordTypeIncident,
			SearchTerm: "server",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				api.On("LogDebug", mock.AnythingOfType("string"), "Error", "marshal error")
				return api
			},
			SetupClient: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetClientFromRequest", func(_ *Plugin, _ *http.Request) Client {
					client := mock_plugin.NewClient(t)
					client.On("SearchRecordsInServiceNow", constants.SubscriptionRecordTypeIncident, "server", limit, offset).Return(
						nil, http.StatusOK, nil,
					)
					return client
				})

				monkey.Patch(json.Marshal, func(_ interface{}) ([]byte, error) {
					return nil, fmt.Errorf("marshal error")
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
		"no records fetched from ServiceNow": {
			RecordType: constants.SubscriptionRecordTypeIncident,
			SearchTerm: "server",
			SetupAPI: func(api *plugintest.API) *plugintest.API {
				return api
			},
			SetupClient: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetClientFromRequest", func(_ *Plugin, _ *http.Request) Client {
					client := mock_plugin.NewClient(t)
					client.On("SearchRecordsInServiceNow", constants.SubscriptionRecordTypeIncident, "server", limit, offset).Return(
						nil, http.StatusOK, nil,
					)
					return client
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			api := test.SetupAPI(&plugintest.API{})
			defer api.AssertExpectations(t)
			defer monkey.UnpatchAll()

			p := setupTestPlugin(api, nil)
			test.SetupClient(p)

			monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
				return testutils.GetSerializerUser(), nil
			})

			monkey.PatchInstanceMethod(reflect.TypeOf(p), "ParseAuthToken", func(_ *Plugin, _ string) (*oauth2.Token, error) {
				return nil, nil
			})

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
