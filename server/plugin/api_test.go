package plugin

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"bou.ke/monkey"
	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	mock_plugin "github.com/mattermost/mattermost-plugin-servicenow/server/mocks"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
)

func setupTestPlugin(api *plugintest.API, store *mock_plugin.Store) (*Plugin, *plugintest.API) {
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
	return p, api
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

			p, _ := setupTestPlugin(&plugintest.API{}, store)
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, requestURL, nil)
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
	for name, test := range map[string]struct {
		TeamID               string
		SetupAPI             func(*plugintest.API)
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(testutils.GetChannels(3, model.ChannelTypePrivate), nil)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      3,
		},
		"invalid team id": {
			TeamID: "testTeamID",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", constants.ErrorInvalidTeamID).Return()
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.ErrorInvalidTeamID,
		},
		"failed to get channels": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(nil, testutils.GetBadRequestAppError())
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			ExpectedStatusCode: http.StatusBadRequest,
			ExpectedCount:      -1,
		},
		"no channels present": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(nil, nil)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
		"no public or private channels present": {
			TeamID: testutils.GetID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetChannelsForTeamForUser", testutils.GetID(), testutils.GetID(), false).Return(testutils.GetChannels(3, model.ChannelTypeDirect), nil)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, strings.Replace(requestURL, "{team_id:[A-Za-z0-9]+}", test.TeamID, 1), nil)
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
	limit, offset := testutils.GetLimitAndOffset()
	for name, test := range map[string]struct {
		RecordType           string
		SearchTerm           string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(true),
			SetupAPI:   func(api *plugintest.API) {},
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
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"invalid search term": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(false),
			SetupAPI: func(api *plugintest.API) {
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: fmt.Sprintf("The search term must be at least %d characters long.", constants.CharacterThresholdForSearchingRecords),
		},
		"failed to get records": {
			RecordType: constants.RecordTypeIncident,
			SearchTerm: testutils.GetSearchTerm(true),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...)
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
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			queryParams := url.Values{
				constants.QueryParamSearchTerm: {test.SearchTerm},
			}
			r := httptest.NewRequest(http.MethodGet, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
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
	for name, test := range map[string]struct {
		RecordType           string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI:   func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"failed to get record": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...)
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
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
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

func TestShareRecordInChannel(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathShareRecord)
	for name, test := range map[string]struct {
		RequestBody          string
		ChannelID            string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)

				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(
					nil, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid channel ID": {
			ChannelID: "invalidID",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", constants.ErrorInvalidChannelID).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedErrorMessage: constants.ErrorInvalidChannelID,
			ExpectedStatusCode:   http.StatusBadRequest,
		},
		"invalid request body": {
			RequestBody: "",
			ChannelID:   testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedErrorMessage: constants.ErrorUnmarshallingRequestBody,
			ExpectedStatusCode:   http.StatusBadRequest,
		},
		"invalid record type": {
			RequestBody: `{
		 		"sys_id": "mockSysID",
		 		"record_type": "testRecordType"
		 		}`,
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"failed to get the user": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError(),
				)

				api.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedErrorMessage: constants.ErrorGeneric,
			ExpectedStatusCode:   http.StatusInternalServerError,
		},
		"unable to get permissions for the channel": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)
			},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusInternalServerError, fmt.Errorf(constants.ErrorChannelPermissionsForUser)
				})
			},
			ExpectedErrorMessage: constants.ErrorChannelPermissionsForUser,
			ExpectedStatusCode:   http.StatusInternalServerError,
		},
		"user does not have the permission to share record in the channel": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)
			},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusBadRequest, fmt.Errorf(constants.ErrorInsufficientPermissions)
				})
			},
			ExpectedErrorMessage: constants.ErrorInsufficientPermissions,
			ExpectedStatusCode:   http.StatusBadRequest,
		},
		"failed to get the record": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)

				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					nil, http.StatusForbidden, fmt.Errorf(constants.ErrorGetRecord),
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: constants.ErrorGetRecord,
		},
		"failed to create the post": {
			RequestBody: fmt.Sprintf(`{
				"sys_id": "mockSysID",
				"record_type": "%s"
				}`, constants.RecordTypeIncident),
			ChannelID: testutils.GetChannelID(),
			SetupAPI: func(api *plugintest.API) {
				api.On("GetUser", testutils.GetID()).Return(
					testutils.GetUser(model.SystemAdminRoleId), nil,
				)

				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(
					nil, testutils.GetInternalServerAppError(),
				)

				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode: http.StatusOK,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupAPI(api)
			test.SetupClient(client)
			test.SetupPlugin(p)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, strings.Replace(requestURL, "{channel_id:[A-Za-z0-9]+}", test.ChannelID, 1), bytes.NewBufferString(test.RequestBody))
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

func TestGetCommentsForRecord(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCommentsForRecord)
	requestURL = strings.Replace(requestURL, "{record_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1)
	for name, test := range map[string]struct {
		RecordType           string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI:   func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllComments", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					testutils.GetServiceNowComments(), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"failed to get comments": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...)
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllComments", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					nil, http.StatusInternalServerError, fmt.Errorf("new error"),
				)
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "new error",
		},
		"failed to marshal comments": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "marshal error")
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllComments", constants.RecordTypeIncident, testutils.GetServiceNowSysID()).Return(
					testutils.GetServiceNowComments(), http.StatusOK, nil,
				)

				monkey.Patch(json.Marshal, func(_ interface{}) ([]byte, error) {
					return nil, fmt.Errorf("marshal error")
				})
			},
			ExpectedStatusCode: http.StatusInternalServerError,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
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

func TestAddCommentsOnRecord(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCommentsForRecord)
	requestURL = strings.Replace(requestURL, "{record_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1)
	for name, test := range map[string]struct {
		RecordType           string
		RequestBody          string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			RequestBody: `{
				"comments": "mockComment"
			}`,
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("AddComment", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("*serializer.ServiceNowCommentPayload")).Return(
					http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"invalid request body": {
			RecordType:  constants.RecordTypeIncident,
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"failed to add comment": {
			RecordType: constants.RecordTypeIncident,
			RequestBody: `{
				"comments": "mockComment"
			}`,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("AddComment", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("*serializer.ServiceNowCommentPayload")).Return(
					http.StatusInternalServerError, fmt.Errorf("add comment error"),
				)
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "add comment error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), bytes.NewBufferString(test.RequestBody))
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

func TestGetStatesForRecordType(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathGetStatesForRecordType)
	for name, test := range map[string]struct {
		RecordType           string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedCount        int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeFollowOnTask,
			SetupAPI:   func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetStatesFromServiceNow", constants.RecordTypeTask).Return(
					testutils.GetServiceNowStates(3), http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      3,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"failed to get states": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...)
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetStatesFromServiceNow", constants.RecordTypeIncident).Return(
					nil, http.StatusInternalServerError, fmt.Errorf("get states error"),
				)
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "Error in getting the states. Error: get states error",
			ExpectedCount:        -1,
		},
		"failed to marshal states": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "marshal error")
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetStatesFromServiceNow", constants.RecordTypeIncident).Return(
					testutils.GetServiceNowStates(3), http.StatusOK, nil,
				)

				monkey.Patch(json.Marshal, func(_ interface{}) ([]byte, error) {
					return nil, fmt.Errorf("marshal error")
				})
			},
			ExpectedStatusCode: http.StatusInternalServerError,
			ExpectedCount:      0,
		},
		"no states fetched from ServiceNow": {
			RecordType: constants.RecordTypeIncident,
			SetupAPI:   func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetStatesFromServiceNow", constants.RecordTypeIncident).Return(
					nil, http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), nil)
			r.Header.Add(constants.HeaderMattermostUserID, testutils.GetID())
			p.ServeHTTP(nil, w, r)

			result := w.Result()
			require.NotNil(t, result)
			defer result.Body.Close()

			assert.Equal(test.ExpectedStatusCode, result.StatusCode)

			if test.ExpectedCount != -1 {
				var states []*serializer.ServiceNowState
				err := json.NewDecoder(result.Body).Decode(&states)
				require.Nil(t, err)

				assert.Equal(test.ExpectedCount, len(states))
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

func TestUpdateStateOfRecord(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathUpdateStateOfRecord)
	requestURL = strings.Replace(requestURL, "{record_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1)
	for name, test := range map[string]struct {
		RecordType           string
		RequestBody          string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RecordType: constants.RecordTypeIncident,
			RequestBody: `{
				"state": "mockState"
			}`,
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("UpdateStateOfRecordInServiceNow", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("*serializer.ServiceNowUpdateStatePayload")).Return(
					http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid record type": {
			RecordType: "testRecordType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Record type", "testRecordType").Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInvalidRecordType,
		},
		"invalid request body": {
			RecordType:  constants.RecordTypeIncident,
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"valid body with empty state": {
			RecordType: constants.RecordTypeIncident,
			RequestBody: `{
				"state": ""
			}`,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"failed to update state": {
			RecordType: constants.RecordTypeIncident,
			RequestBody: `{
				"state": "mockState"
			}`,
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("UpdateStateOfRecordInServiceNow", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("*serializer.ServiceNowUpdateStatePayload")).Return(
					http.StatusInternalServerError, fmt.Errorf("update state error"),
				)
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "update state error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPatch, strings.Replace(requestURL, "{record_type}", test.RecordType, 1), bytes.NewBufferString(test.RequestBody))
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
	for name, test := range map[string]struct {
		RequestBody        string
		SetupAPI           func(*plugintest.API)
		ExpectedStatusCode int
	}{
		"success": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) {
				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(nil, nil)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"failed to create post": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) {
				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(nil, testutils.GetBadRequestAppError())
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			ExpectedStatusCode: http.StatusOK,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			queryParams := url.Values{
				"secret": {testutils.GetSecret()},
			}
			r := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBufferString(test.RequestBody))
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
	for name, test := range map[string]struct {
		RequestBody          string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusOK, nil,
				)

				client.On("CreateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusCreated, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode: http.StatusCreated,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedErrorMessage: constants.ErrorUnmarshallingRequestBody,
			ExpectedStatusCode:   http.StatusBadRequest,
		},
		"invalid subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return fmt.Errorf("new error")
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "new error",
		},
		"user ID does not match with the user making request": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "mockUserID",
				"channel_id": "%s"
			  	}`, testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", constants.ErrorUserMismatch).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorUserMismatch,
		},
		"unable to get permissions for the channel": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI:    func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusInternalServerError, fmt.Errorf(constants.ErrorChannelPermissionsForUser)
				})
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: constants.ErrorChannelPermissionsForUser,
		},
		"user does not have the permission to create a subscription for this channel": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI:    func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusBadRequest, fmt.Errorf(constants.ErrorInsufficientPermissions)
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInsufficientPermissions,
		},
		"failed to check duplicate subscription": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusForbidden, fmt.Errorf("duplicate subscription error"),
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "duplicate subscription error",
		},
		"duplicate subscription exists": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					true, http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "Subscription already exists",
		},
		"failed to create subscription": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CheckForDuplicateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					false, http.StatusOK, nil,
				)

				client.On("CreateSubscription", mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusForbidden, fmt.Errorf("create subscription error"),
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForCreation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "create subscription error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			test.SetupPlugin(p)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBufferString(test.RequestBody))
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
	limit, offset := testutils.GetLimitAndOffset()
	for name, test := range map[string]struct {
		ChannelID            string
		UserID               string
		SubscriptionType     string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
		ExpectedCount        int
	}{
		"success": {
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					testutils.GetSubscriptions(4), http.StatusOK, nil,
				)

				client.On("GetRecordFromServiceNow", constants.RecordTypeProblem, "").Return(
					testutils.GetServiceNowRecord(), http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      4,
		},
		"invalid channel id": {
			ChannelID: "testChannelID",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamChannelID).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamChannelID,
		},
		"invalid user id": {
			UserID: "testUserID",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamUserID).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamUserID,
		},
		"invalid subscription type": {
			SubscriptionType: "testSubscriptionType",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Query param", constants.QueryParamSubscriptionType).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedCount:        -1,
			ExpectedErrorMessage: constants.QueryParamSubscriptionType,
		},
		"failed to get subscriptions": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "get subscriptions error").Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					nil, http.StatusForbidden, fmt.Errorf("get subscriptions error"),
				)
			},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedCount:        -1,
			ExpectedErrorMessage: "get subscriptions error",
		},
		"unable to get permissions for the channel": {
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					testutils.GetSubscriptions(4), http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusInternalServerError, fmt.Errorf(constants.ErrorChannelPermissionsForUser)
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
		"user does not have permission for the subscriptions channel": {
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", "", "", "", limit, offset).Return(
					testutils.GetSubscriptions(4), http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusBadRequest, fmt.Errorf(constants.ErrorInsufficientPermissions)
				})
			},
			ExpectedStatusCode: http.StatusOK,
			ExpectedCount:      0,
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			test.SetupPlugin(p)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			queryParams := url.Values{
				constants.QueryParamChannelID:        {test.ChannelID},
				constants.QueryParamUserID:           {test.UserID},
				constants.QueryParamSubscriptionType: {test.SubscriptionType},
			}
			r := httptest.NewRequest(http.MethodGet, requestURL, nil)
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
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", testutils.GetServiceNowSysID()).Return(
					http.StatusOK, nil,
				)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"failed to delete subscription": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "subscriptionID", testutils.GetServiceNowSysID(), "Error", "delete subscription error").Return()
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
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodDelete, strings.Replace(requestURL, "{subscription_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1), nil)
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
	for name, test := range map[string]struct {
		RequestBody          string
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"success": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("EditSubscription", testutils.GetServiceNowSysID(), mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusOK, nil,
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid request body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupClient:          func(client *mock_plugin.Client) {},
			SetupPlugin:          func(p *Plugin) {},
			ExpectedErrorMessage: constants.ErrorUnmarshallingRequestBody,
			ExpectedStatusCode:   http.StatusBadRequest,
		},
		"invalid subscription": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "new error").Return()
			},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return fmt.Errorf("new error")
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: "new error",
		},
		"unable to get permissions for the channel": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI:    func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusInternalServerError, fmt.Errorf(constants.ErrorChannelPermissionsForUser)
				})
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: constants.ErrorChannelPermissionsForUser,
		},
		"user does not have permission to edit the subscription for this channel": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI:    func(api *plugintest.API) {},
			SetupClient: func(client *mock_plugin.Client) {},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusBadRequest, fmt.Errorf(constants.ErrorInsufficientPermissions)
				})
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.ErrorInsufficientPermissions,
		},
		"failed to edit subscription": {
			RequestBody: fmt.Sprintf(`{
				"user_id": "%s",
				"channel_id": "%s"
			  	}`, testutils.GetID(), testutils.GetChannelID()),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "subscriptionID", testutils.GetServiceNowSysID(), "Error", "edit subscription error").Return()
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("EditSubscription", testutils.GetServiceNowSysID(), mock.AnythingOfType("*serializer.SubscriptionPayload")).Return(
					http.StatusForbidden, fmt.Errorf("edit subscription error"),
				)
			},
			SetupPlugin: func(p *Plugin) {
				var s *serializer.SubscriptionPayload
				monkey.PatchInstanceMethod(reflect.TypeOf(s), "IsValidForUpdation", func(_ *serializer.SubscriptionPayload, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasPublicOrPrivateChannelPermissions", func(_ *Plugin, _, _ string) (int, error) {
					return http.StatusOK, nil
				})
			},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: "edit subscription error",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForSubscriptionsConfiguredMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			test.SetupPlugin(p)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPatch, strings.Replace(requestURL, "{subscription_id:[0-9a-f]{32}}", testutils.GetServiceNowSysID(), 1), bytes.NewBufferString(test.RequestBody))
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
	t.Run("user id not present", func(t *testing.T) {
		assert := assert.New(t)
		p, _ := setupTestPlugin(&plugintest.API{}, nil)
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, requestURL, nil)
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
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API)
		SetupPlugin          func(p *Plugin)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"user not connected": {
			SetupAPI: func(api *plugintest.API) {},
			SetupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "GetUser", func(_ *Plugin, _ string) (*serializer.User, error) {
					return nil, ErrNotFound
				})
			},
			ExpectedStatusCode:   http.StatusUnauthorized,
			ExpectedErrorMessage: constants.APIErrorNotConnected,
		},
		"failed to get user": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "get user error")
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
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "token error")
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
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			test.SetupPlugin(p)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, requestURL, nil)
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
	for name, test := range map[string]struct {
		SetupAPI             func(*plugintest.API)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"subscriptions not configured": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", constants.APIErrorIDSubscriptionsNotConfigured)
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("ActivateSubscriptions").Return(0, fmt.Errorf(constants.APIErrorIDSubscriptionsNotConfigured))
			},
			ExpectedStatusCode:   http.StatusBadRequest,
			ExpectedErrorMessage: constants.APIErrorSubscriptionsNotConfigured,
		},
		"subscriptions not authorized": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", constants.APIErrorIDSubscriptionsNotAuthorized)
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("ActivateSubscriptions").Return(0, fmt.Errorf(constants.APIErrorIDSubscriptionsNotAuthorized))
			},
			ExpectedStatusCode:   http.StatusUnauthorized,
			ExpectedErrorMessage: constants.APIErrorSubscriptionsNotAuthorized,
		},
		"failed to check or activate subscriptions": {
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", mock.AnythingOfType("string"), "Error", "generic error")
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
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, requestURL, nil)
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

func TestCreateIncident(t *testing.T) {
	requestURL := fmt.Sprintf("%s%s", constants.PathPrefix, constants.PathCreateIncident)
	for name, test := range map[string]struct {
		RequestBody          string
		SetupAPI             func(*plugintest.API)
		SetupPlugin          func(p *Plugin)
		SetupClient          func(client *mock_plugin.Client)
		ExpectedStatusCode   int
		ExpectedErrorMessage string
	}{
		"incident created successfully": {
			RequestBody: testutils.GetCreateIncidentPayload(),
			SetupAPI: func(api *plugintest.API) {
				api.On("CreatePost", mock.AnythingOfType("*model.Post")).Return(&model.Post{}, nil)
				api.On("HasPermissionToChannel", testutils.GetID(), testutils.GetChannelID(), model.PermissionCreatePost).Return(true)
			},
			SetupPlugin: func(p *Plugin) {
				record := &serializer.ServiceNowRecord{}

				monkey.PatchInstanceMethod(reflect.TypeOf(record), "HandleNestedFields", func(_ *serializer.ServiceNowRecord, _ string) error {
					return nil
				})

				monkey.PatchInstanceMethod(reflect.TypeOf(record), "CreateSharingPost", func(_ *serializer.ServiceNowRecord, _, _, _, _, _ string) *model.Post {
					return &model.Post{}
				})
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CreateIncident", mock.AnythingOfType("*serializer.IncidentPayload")).Return(&serializer.IncidentResponse{}, http.StatusOK, nil)
			},
			ExpectedStatusCode: http.StatusOK,
		},
		"invalid body": {
			RequestBody: "",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupPlugin:        func(p *Plugin) {},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"invalid incident": {
			RequestBody: "{}",
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			SetupPlugin:        func(p *Plugin) {},
			SetupClient:        func(client *mock_plugin.Client) {},
			ExpectedStatusCode: http.StatusBadRequest,
		},
		"does not have permission to access the channel": {
			RequestBody: testutils.GetCreateIncidentPayload(),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogDebug", testutils.GetMockArgumentsWithType("string", 5)...).Return()
				api.On("HasPermissionToChannel", testutils.GetID(), testutils.GetChannelID(), model.PermissionCreatePost).Return(false)
			},
			SetupPlugin:          func(p *Plugin) {},
			SetupClient:          func(client *mock_plugin.Client) {},
			ExpectedStatusCode:   http.StatusForbidden,
			ExpectedErrorMessage: constants.ErrorInsufficientPermissions,
		},
		"failed to create incident": {
			RequestBody: testutils.GetCreateIncidentPayload(),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				api.On("HasPermissionToChannel", testutils.GetID(), testutils.GetChannelID(), model.PermissionCreatePost).Return(true)
			},
			SetupPlugin: func(p *Plugin) {},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CreateIncident", mock.AnythingOfType("*serializer.IncidentPayload")).Return(&serializer.IncidentResponse{}, http.StatusInternalServerError, errors.New("error occurred while creating the incident"))
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "error occurred while creating the incident",
		},
		"error while handling the nested fields": {
			RequestBody: testutils.GetCreateIncidentPayload(),
			SetupAPI: func(api *plugintest.API) {
				api.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				api.On("HasPermissionToChannel", testutils.GetID(), testutils.GetChannelID(), model.PermissionCreatePost).Return(true)
			},
			SetupPlugin: func(p *Plugin) {
				record := &serializer.ServiceNowRecord{}

				monkey.PatchInstanceMethod(reflect.TypeOf(record), "HandleNestedFields", func(_ *serializer.ServiceNowRecord, _ string) error {
					return errors.New("error while handling the nested fields")
				})
			},
			SetupClient: func(client *mock_plugin.Client) {
				client.On("CreateIncident", mock.AnythingOfType("*serializer.IncidentPayload")).Return(&serializer.IncidentResponse{}, http.StatusOK, nil)
			},
			ExpectedStatusCode:   http.StatusInternalServerError,
			ExpectedErrorMessage: "error while handling the nested fields",
		},
	} {
		t.Run(name, func(t *testing.T) {
			assert := assert.New(t)
			defer monkey.UnpatchAll()

			p, api := setupTestPlugin(&plugintest.API{}, nil)
			client := setupPluginForCheckOAuthMiddleware(p, t)
			test.SetupClient(client)
			test.SetupAPI(api)
			test.SetupPlugin(p)
			defer api.AssertExpectations(t)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBufferString(test.RequestBody))
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
