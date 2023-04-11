package plugin

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"sync"
	"testing"
	"time"

	"bou.ke/monkey"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	mock_plugin "github.com/mattermost/mattermost-plugin-servicenow/server/mocks"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
)

func (p *Plugin) mockHandleDisconnect(*model.CommandArgs, []string, Client, bool) string {
	return "mockHandleDisconnect"
}

func (p *Plugin) mockHandleSubscriptions(*model.CommandArgs, []string, Client, bool) string {
	return "mockHandleSubscriptions"
}

func (p *Plugin) mockHandleDeleteSubscription(*model.CommandArgs, []string, Client, bool) string {
	return "mockHandleDeleteSubscription"
}

func (p *Plugin) mockHandleRecords(*model.CommandArgs, []string, Client, bool) string {
	return "mockHandleRecords"
}

func setMockConfigurations(p *Plugin) {
	p.setConfiguration(&configuration{
		ServiceNowBaseURL:           "mockServiceNowBaseURL",
		WebhookSecret:               "mockWebhookSecret",
		ServiceNowOAuthClientID:     "mockServiceNowOAuthClientID",
		ServiceNowOAuthClientSecret: "mockServiceNowOAuthClientSecret",
		EncryptionSecret:            "mockEncryptionSecret",
	})
}

func TestExecuteCommand(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	p.CommandHandlers = map[string]CommandHandleFunc{
		constants.CommandDisconnect:    p.mockHandleDisconnect,
		constants.CommandSubscriptions: p.mockHandleSubscriptions,
		constants.CommandUnsubscribe:   p.mockHandleDeleteSubscription,
		constants.CommandRecords:       p.mockHandleRecords,
	}
	for _, testCase := range []struct {
		description      string
		setupAPI         func(*plugintest.API)
		setupPlugin      func()
		args             *model.CommandArgs
		isResponse       bool
		expectedResponse string
	}{
		{
			description: "ExecuteCommand: Invalid command",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {},
			args: &model.CommandArgs{
				Command: "/invalid",
			},
		},
		{
			description: "ExecuteCommand: Not able to check if user is system admin",
			setupAPI: func(a *plugintest.API) {
				a.On("LogWarn", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return false, errors.New("error while checking for user authorization")
				})
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: "Error checking user's permissions",
		},
		{
			description: "ExecuteCommand: Invalid configurations",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				p.setConfiguration(&configuration{})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("%s: %s", constants.InvalidConfigAdminMessage, constants.ErrorEmptyServiceNowURL),
		},
		{
			description: "ExecuteCommand: User not connected",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return nil, errors.New("error while getting the user")
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("[%s](%s%s)", constants.UserConnectMessage, p.GetPluginURL(), constants.PathOAuth2Connect),
		},
		{
			description: "ExecuteCommand: User already connected",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: constants.UserAlreadyConnectedMessage,
		},
		{
			description: "ExecuteCommand: Help command",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow help",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: p.getHelpMessage(helpCommandHeader, true),
		},
		{
			description: "ExecuteCommand: Unknown action",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return testutils.GetSerializerUser(), nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow invalid",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: "Unknown action `invalid`",
		},
		{
			description: "ExecuteCommand: Disconnect command",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow disconnect",
				UserId:  testutils.GetID(),
			},
			isResponse:       true,
			expectedResponse: "mockHandleDisconnect",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			testCase.setupPlugin()
			p.SetAPI(mockAPI)

			if testCase.isResponse {
				mockAPI.On("SendEphemeralPost", mock.AnythingOfType("string"), mock.AnythingOfType("*model.Post")).Run(func(args mock.Arguments) {
					post := args.Get(1).(*model.Post)
					assert.Equal(testCase.expectedResponse, post.Message)
				}).Once().Return(&model.Post{})
			}

			resp, err := p.ExecuteCommand(&plugin.Context{}, testCase.args)

			assert.EqualValues(&model.CommandResponse{}, resp)
			assert.Nil(err)
		})
	}
}

func TestCheckConnected(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		setupAPI         func(*plugintest.API)
		isResponse       bool
		expectedResponse string
		errorMessage     error
	}{
		{
			description: "CheckConnected: Success",
			setupAPI:    func(a *plugintest.API) {},
		},
		{
			description:      "CheckConnected: User not found",
			setupAPI:         func(a *plugintest.API) {},
			isResponse:       true,
			expectedResponse: fmt.Sprintf(notConnectedMessage, p.GetPluginURL(), constants.PathOAuth2Connect),
			errorMessage:     ErrNotFound,
		},
		{
			description: "CheckConnected: Unable to get the user",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			errorMessage:     errors.New("unable to get the user"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
				return testutils.GetSerializerUser(), testCase.errorMessage
			})

			if testCase.isResponse {
				mockAPI.On("SendEphemeralPost", mock.AnythingOfType("string"), mock.AnythingOfType("*model.Post")).Run(func(args mock.Arguments) {
					post := args.Get(1).(*model.Post)
					assert.Equal(testCase.expectedResponse, post.Message)
				}).Once().Return(&model.Post{})
			}

			resp := p.checkConnected(args)

			if testCase.errorMessage != nil {
				assert.Nil(resp)
				return
			}

			assert.NotNil(resp)
		})
	}
}

func TestGetClientFromUser(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	for _, testCase := range []struct {
		description      string
		setupAPI         func(*plugintest.API)
		isResponse       bool
		expectedResponse string
		errorMessage     error
	}{
		{
			description: "GetClientFromUser: Success",
			setupAPI:    func(a *plugintest.API) {},
		},
		{
			description: "GetClientFromUser: Unable to parse the token",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			errorMessage:     errors.New("unable to parse the token"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			monkey.PatchInstanceMethod(reflect.TypeOf(&p), "ParseAuthToken", func(*Plugin, string) (*oauth2.Token, error) {
				return &oauth2.Token{}, testCase.errorMessage
			})

			if testCase.isResponse {
				mockAPI.On("SendEphemeralPost", mock.AnythingOfType("string"), mock.AnythingOfType("*model.Post")).Run(func(args mock.Arguments) {
					post := args.Get(1).(*model.Post)
					assert.Equal(testCase.expectedResponse, post.Message)
				}).Once().Return(&model.Post{})
			}

			resp := p.GetClientFromUser(&model.CommandArgs{}, &serializer.User{
				OAuth2Token: testutils.GetSerializerUser().OAuth2Token,
			})

			if testCase.errorMessage != nil {
				assert.Nil(resp)
				return
			}

			assert.NotNil(resp)
		})
	}
}

func TestHandleDisconnect(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		setupAPI         func(*plugintest.API)
		expectedResponse string
		errorMessage     error
	}{
		{
			description: "HandleDisconnect: Success",
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
			expectedResponse: disconnectSuccessMessage,
		},
		{
			description: "HandleDisconnect: Unable to disconnect the user",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			expectedResponse: disconnectErrorMessage,
			errorMessage:     errors.New("unable to disconnect the user"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			monkey.PatchInstanceMethod(reflect.TypeOf(&p), "DisconnectUser", func(*Plugin, string) error {
				return testCase.errorMessage
			})

			resp := p.handleDisconnect(args, []string{}, mock_plugin.NewClient(t), true)

			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleSubscriptions(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		setupPlugin      func(p *Plugin)
		expectedResponse string
	}{
		{
			description:      "HandleSubscriptions: Invalid number of params",
			setupPlugin:      func(p *Plugin) {},
			expectedResponse: "Invalid subscribe command. Available commands are 'list', 'add', 'edit' and 'delete'.",
		},
		{
			description:      "HandleSubscriptions: Unknown command",
			params:           []string{"invalidCommand"},
			setupPlugin:      func(p *Plugin) {},
			expectedResponse: "Unknown subcommand invalidCommand",
		},
		{
			description: "HandleCreate: list command",
			params:      []string{"list"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleListSubscriptions", func(*Plugin, *model.CommandArgs, []string, Client, bool) string {
					return "list command executed successfully"
				})
			},
			expectedResponse: "list command executed successfully",
		},
		{
			description: "HandleCreate: add command",
			params:      []string{"add"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleSubscribe", func(*Plugin, *model.CommandArgs) string {
					return "add command executed successfully"
				})
			},
			expectedResponse: "add command executed successfully",
		},
		{
			description: "HandleCreate: edit command",
			params:      []string{"edit"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleEditSubscription", func(*Plugin, *model.CommandArgs, []string, Client, bool) string {
					return "edit command executed successfully"
				})
			},
			expectedResponse: "edit command executed successfully",
		},
		{
			description: "HandleCreate: delete command",
			params:      []string{"delete"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleDeleteSubscription", func(*Plugin, *model.CommandArgs, []string, Client, bool) string {
					return "delete command executed successfully"
				})
			},
			expectedResponse: "delete command executed successfully",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			testCase.setupPlugin(&p)
			resp := p.handleSubscriptions(args, testCase.params, mock_plugin.NewClient(t), true)
			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleCreate(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		setupPlugin      func(p *Plugin)
		expectedResponse string
	}{
		{
			description:      "HandleCreate: Invalid number of params",
			setupPlugin:      func(p *Plugin) {},
			expectedResponse: "Invalid create command. Available commands are 'incident' and 'request'.",
		},
		{
			description:      "HandleCreate: Unknown command",
			params:           []string{"invalidCommand"},
			setupPlugin:      func(p *Plugin) {},
			expectedResponse: "Unknown subcommand invalidCommand",
		},
		{
			description: "HandleCreate: incident command",
			params:      []string{"incident"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleCreateIncident", func(*Plugin, *model.CommandArgs) string {
					return "incident command executed successfully"
				})
			},
			expectedResponse: "incident command executed successfully",
		},
		{
			description: "HandleCreate: request command",
			params:      []string{"request"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleCreateRequest", func(*Plugin, *model.CommandArgs) string {
					return "request command executed successfully"
				})
			},
			expectedResponse: "request command executed successfully",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			testCase.setupPlugin(&p)
			resp := p.handleCreate(args, testCase.params, mock_plugin.NewClient(t), true)
			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleRecords(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		setupPlugin      func(p *Plugin)
		expectedResponse string
	}{
		{
			description:      "HandleRecords: Invalid number of params",
			expectedResponse: "Invalid record command. Available command is 'share'.",
			setupPlugin:      func(p *Plugin) {},
		},
		{
			description:      "HandleRecords: Unknown command",
			params:           []string{"invalidCommand"},
			expectedResponse: "Unknown subcommand invalidCommand",
			setupPlugin:      func(p *Plugin) {},
		},
		{
			description: "HandleRecords: share command",
			params:      []string{"share"},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HandleSearchAndShare", func(*Plugin, *model.CommandArgs) string {
					return "share command executed successfully"
				})
			},
			expectedResponse: "share command executed successfully",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			testCase.setupPlugin(&p)
			resp := p.handleRecords(args, testCase.params, mock_plugin.NewClient(t), true)
			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleListSubscriptions(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId:    testutils.GetID(),
		ChannelId: testutils.GetChannelID(),
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		setupAPI         func(*plugintest.API)
		setupClient      func(client *mock_plugin.Client)
		setupPlugin      func(p *Plugin)
		isResponse       bool
		expectedResponse string
		expectedError    string
	}{
		{
			description:   "HandleListSubscriptions: Invalid filter for user subscriptions",
			params:        []string{"invalid"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			setupPlugin:   func(p *Plugin) {},
			expectedError: "Unknown filter invalid",
		},
		{
			description:   "HandleListSubscriptions: Invalid filter for channel subscriptions",
			params:        []string{constants.FilterCreatedByMe, "invalid"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			setupPlugin:   func(p *Plugin) {},
			expectedError: "Unknown filter invalid",
		},
		{
			description: "HandleListSubscriptions: Unable to get the subscriptions",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					nil, 0, errors.New("unable to get the subscriptions"),
				)
			},
			setupPlugin:      func(p *Plugin) {},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: No subscriptions present",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					testutils.GetSubscriptions(0), 0, nil,
				)
			},
			setupPlugin:      func(p *Plugin) {},
			isResponse:       true,
			expectedResponse: constants.ErrorNoActiveSubscriptions,
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: Unable to get user and channel",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError(""),
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError(""),
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					testutils.GetSubscriptions(2), 0, nil,
				)
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					testutils.GetServiceNowRecord(), 0, nil,
				)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasChannelPermissions", func(_ *Plugin, _, _ string, _ bool) (int, string, error) {
					return http.StatusOK, "", nil
				})
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel | Filters | \n| :----|:--------| :--------|:--------|:--------|:---------|\n|%s|Problem|Priority changed, State changed|N/A|N/A|N/A|\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|%s|Problem|PRB0000005|Test description|Priority changed, State changed|N/A|N/A|", testutils.GetServiceNowSysID(), testutils.GetServiceNowSysID()),
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: Unable to get permissions for channel",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					testutils.GetUser(model.SYSTEM_ADMIN_ROLE_ID), nil,
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_PRIVATE), nil,
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					testutils.GetSubscriptions(2), 0, nil,
				)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasChannelPermissions", func(_ *Plugin, _, _ string, _ bool) (int, string, error) {
					return http.StatusInternalServerError, "", fmt.Errorf(constants.ErrorChannelPermissionsForUser)
				})
			},
			isResponse:       true,
			expectedResponse: constants.ErrorNoActiveSubscriptions,
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: User does not have permissions for the subscriptions in the channel",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError("unable to get the user"),
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError("unable to get the channel"),
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					testutils.GetSubscriptions(2), 0, nil,
				)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasChannelPermissions", func(_ *Plugin, _, _ string, _ bool) (int, string, error) {
					return http.StatusBadRequest, "", fmt.Errorf(constants.ErrorInsufficientPermissions)
				})
			},
			isResponse:       true,
			expectedResponse: constants.ErrorNoActiveSubscriptions,
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: Success",
			params:      []string{constants.FilterCreatedByMe, constants.FilterAllChannels},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					testutils.GetUser(model.SYSTEM_ADMIN_ROLE_ID), nil,
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_PRIVATE), nil,
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					testutils.GetSubscriptions(2), 0, nil,
				)
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					testutils.GetServiceNowRecord(), 0, nil,
				)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "HasChannelPermissions", func(_ *Plugin, _, _ string, _ bool) (int, string, error) {
					return http.StatusOK, "", nil
				})
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel | Filters | \n| :----|:--------| :--------|:--------|:--------|:---------|\n|%s|Problem|Priority changed, State changed|N/A|N/A|N/A|\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|%s|Problem|PRB0000005|Test description|Priority changed, State changed|N/A|N/A|", testutils.GetServiceNowSysID(), testutils.GetServiceNowSysID()),
			expectedError:    listSubscriptionsWaitMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			c := mock_plugin.NewClient(t)
			testCase.setupAPI(mockAPI)
			testCase.setupClient(c)
			testCase.setupPlugin(&p)
			p.SetAPI(mockAPI)

			if testCase.isResponse {
				mockAPI.On("SendEphemeralPost", mock.AnythingOfType("string"), mock.AnythingOfType("*model.Post")).Run(func(args mock.Arguments) {
					post := args.Get(1).(*model.Post)
					assert.Equal(testCase.expectedResponse, post.Message)
				}).Once().Return(&model.Post{})
			}

			resp := p.HandleListSubscriptions(args, testCase.params, c, true)

			// This is used to wait for goroutine to finish.
			time.Sleep(100 * time.Millisecond)
			assert.EqualValues(testCase.expectedError, resp)
		})
	}
}

func TestHandleDeleteSubscription(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		setupAPI         func(*plugintest.API)
		setupClient      func(client *mock_plugin.Client)
		isResponse       bool
		expectedResponse string
		expectedError    string
	}{
		{
			description: "HandleDeleteSubscription: Success",
			params:      []string{testutils.GetServiceNowSysID()},
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", testutils.GetServiceNowSysID()).Return(
					0, nil,
				)
			},
			isResponse:       true,
			expectedResponse: deleteSubscriptionSuccessMessage,
			expectedError:    genericWaitMessage,
		},
		{
			description:   "HandleDeleteSubscription: Invalid number of params",
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			expectedError: constants.ErrorCommandInvalidNumberOfParams,
		},
		{
			description:      "HandleDeleteSubscription: Invalid subscription ID",
			params:           []string{"invalidID"},
			setupAPI:         func(a *plugintest.API) {},
			setupClient:      func(client *mock_plugin.Client) {},
			isResponse:       true,
			expectedResponse: invalidSubscriptionIDMessage,
			expectedError:    genericWaitMessage,
		},
		{
			description: "HandleDeleteSubscription: Unable to delete the subscription",
			params:      []string{testutils.GetServiceNowSysID()},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", testutils.GetServiceNowSysID()).Return(
					0, errors.New("unable to delete the subscription"),
				)
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			expectedError:    genericWaitMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			c := mock_plugin.NewClient(t)
			testCase.setupAPI(mockAPI)
			testCase.setupClient(c)
			p.SetAPI(mockAPI)

			if testCase.isResponse {
				mockAPI.On("SendEphemeralPost", mock.AnythingOfType("string"), mock.AnythingOfType("*model.Post")).Run(func(args mock.Arguments) {
					post := args.Get(1).(*model.Post)
					assert.Equal(testCase.expectedResponse, post.Message)
				}).Once().Return(&model.Post{})
			}

			resp := p.HandleDeleteSubscription(args, testCase.params, c, true)
			assert.EqualValues(testCase.expectedError, resp)
			time.Sleep(100 * time.Millisecond)
		})
	}
}

func TestHandleEditSubscription(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: testutils.GetID(),
	}
	for _, testCase := range []struct {
		description   string
		params        []string
		setupAPI      func(*plugintest.API)
		setupClient   func(client *mock_plugin.Client)
		setupPlugin   func()
		expectedError string
	}{
		{
			description: "HandleEditSubscription: Success",
			params:      []string{testutils.GetServiceNowSysID()},
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetSubscription", testutils.GetServiceNowSysID()).Return(
					testutils.GetSubscription(constants.SubscriptionTypeBulk, false), 0, nil,
				)
			},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetFiltersFromServiceNow", func(*Plugin, *serializer.SubscriptionResponse, Client, *sync.WaitGroup, bool) {})
			},
		},
		{
			description:   "HandleEditSubscription: Invalid number of params",
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			setupPlugin:   func() {},
			expectedError: constants.ErrorCommandInvalidNumberOfParams,
		},
		{
			description:   "HandleEditSubscription: Invalid subscription ID",
			params:        []string{"invalidID"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			setupPlugin:   func() {},
			expectedError: invalidSubscriptionIDMessage,
		},
		{
			description: "HandleEditSubscription: Unable to get the subscription",
			params:      []string{testutils.GetServiceNowSysID()},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetSubscription", testutils.GetServiceNowSysID()).Return(
					nil, 0, errors.New("unable to get the subscription"),
				)
			},
			setupPlugin:   func() {},
			expectedError: genericErrorMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			c := mock_plugin.NewClient(t)
			testCase.setupAPI(mockAPI)
			testCase.setupClient(c)
			testCase.setupPlugin()
			p.SetAPI(mockAPI)

			resp := p.HandleEditSubscription(args, testCase.params, c, true)
			assert.EqualValues(testCase.expectedError, resp)
		})
	}
}

func TestGetAutocompleteData(t *testing.T) {
	t.Run("GetAutocompleteData", func(t *testing.T) {
		assert := assert.New(t)
		resp := getAutocompleteData()
		assert.NotNil(resp)
	})
}

func TestParseCommand(t *testing.T) {
	expectedCommand := "/servicenow"
	for _, testCase := range []struct {
		description        string
		input              string
		expectedAction     string
		expectedParameters []string
	}{
		{
			description:        "ParseCommand: subscriptions list command",
			input:              " /servicenow subscriptions   list  me  all_channels ",
			expectedAction:     constants.CommandSubscriptions,
			expectedParameters: []string{constants.SubCommandList, constants.FilterCreatedByMe, constants.FilterAllChannels},
		},
		{
			description:        "ParseCommand: subscriptions add command",
			input:              "/servicenow subscriptions add",
			expectedAction:     constants.CommandSubscriptions,
			expectedParameters: []string{constants.SubCommandAdd},
		},
		{
			description:        "ParseCommand: subscriptions edit command",
			input:              "/servicenow subscriptions edit mockID",
			expectedAction:     constants.CommandSubscriptions,
			expectedParameters: []string{constants.SubCommandEdit, "mockID"},
		},
		{
			description:        "ParseCommand: subscriptions delete command",
			input:              "     /servicenow       subscriptions      delete     mockID    ",
			expectedAction:     constants.CommandSubscriptions,
			expectedParameters: []string{constants.SubCommandDelete, "mockID"},
		},
		{
			description:        "ParseCommand: records command",
			input:              "/servicenow records share",
			expectedAction:     constants.CommandRecords,
			expectedParameters: []string{constants.SubCommandSearchAndShare},
		},
		{
			description:    "ParseCommand: connect command",
			input:          "/servicenow connect",
			expectedAction: constants.CommandConnect,
		},
		{
			description:    "ParseCommand: disconnect command",
			input:          "/servicenow disconnect",
			expectedAction: constants.CommandDisconnect,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			command, action, parameters := parseCommand(testCase.input)

			assert.EqualValues(expectedCommand, command)
			assert.EqualValues(testCase.expectedAction, action)
			assert.EqualValues(testCase.expectedParameters, parameters)
		})
	}
}
