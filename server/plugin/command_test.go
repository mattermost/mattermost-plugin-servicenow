package plugin

import (
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"bou.ke/monkey"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	mock_plugin "github.com/Brightscout/mattermost-plugin-servicenow/server/mocks"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"golang.org/x/oauth2"

	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
)

func (p *Plugin) mockHandleDisconnect(*plugin.Context, *model.CommandArgs, []string, Client, bool) string {
	return "mockHandleDisconnect"
}

func (p *Plugin) mockHandleSubscriptions(*plugin.Context, *model.CommandArgs, []string, Client, bool) string {
	return "mockHandleSubscriptions"
}

func (p *Plugin) mockHandleDeleteSubscription(*plugin.Context, *model.CommandArgs, []string, Client, bool) string {
	return "mockHandleDeleteSubscription"
}

func (p *Plugin) mockHandleSearchAndShare(*plugin.Context, *model.CommandArgs, []string, Client, bool) string {
	return "mockHandleSearchAndShare"
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
		constants.CommandDisconnect:     p.mockHandleDisconnect,
		constants.CommandSubscriptions:  p.mockHandleSubscriptions,
		constants.CommandUnsubscribe:    p.mockHandleDeleteSubscription,
		constants.CommandSearchAndShare: p.mockHandleSearchAndShare,
	}
	userID := "mockUserID"
	for _, testCase := range []struct {
		description      string
		setupAPI         func(*plugintest.API)
		setupPlugin      func()
		args             *model.CommandArgs
		isResponse       bool
		expectedResponse string
		expectedError    *model.AppError
	}{
		{
			description: "ExecuteCommand: Different command",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {},
			args: &model.CommandArgs{
				Command: "/invalid",
			},
		},
		{
			description: "ExecuteCommand: Not able to authorize user",
			setupAPI: func(a *plugintest.API) {
				a.On("LogWarn", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return false, errors.New("mockError")
				})
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  userID,
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
				UserId:  userID,
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("Before using this plugin, you'll need to configure it in the System Console`: %s", constants.ErrorEmptyServiceNowURL),
		},
		{
			description: "ExecuteCommand: User not connected",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return nil, errors.New("mockError")
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  userID,
			},
			isResponse:       true,
			expectedResponse: fmt.Sprintf("[Click here to link your ServiceNow account.](%s%s)", p.GetPluginURL(), constants.PathOAuth2Connect),
		},
		{
			description: "ExecuteCommand: User already connected",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return &serializer.User{}, nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow connect",
				UserId:  userID,
			},
			isResponse:       true,
			expectedResponse: "You are already connected to ServiceNow.",
		},
		{
			description: "ExecuteCommand: Help command",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return &serializer.User{}, nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow help",
				UserId:  userID,
			},
			isResponse:       true,
			expectedResponse: "#### Mattermost ServiceNow Plugin - Slash Command Help\n##### Slash Commands\n* `/servicenow connect` - Connect your Mattermost account to your ServiceNow account\n* `/servicenow disconnect` - Disconnect your Mattermost account from your ServiceNow account\n* `/servicenow subscriptions` - Manage your subscriptions to the record changes in ServiceNow\n* `/servicenow search` - Search a record in ServiceNow and share it in a channel\n* `/servicenow help` - Know about the features of this plugin\n\n\n##### Configure/Enable subscriptions\n* Download the update set XML file from **System Console > Plugins > ServiceNow Plugin > Download ServiceNow Update Set**.\n* Go to ServiceNow and search for Update sets. Then go to \"Retrieved Update Sets\" under \"System Update Sets\".\n* Click on \"Import Update Set from XML\" link.\n* Choose the downloaded XML file from the plugin's config and upload that file.\n* You will be back on the \"Retrieved Update Sets\" page and you'll be able to see an update set named \"ServiceNow for Mattermost Notifications\".\n* Click on that update set and then click on \"Preview Update Set\".\n* After the preview is complete, you have to commit the update set by clicking on the button \"Commit Update Set\".\n* You'll see a warning dialog. You can ignore that and click on \"Proceed with Commit\".\n\n##### Setting up user permissions in ServiceNow\nWithin ServiceNow user roles, add the \"x_830655_mm_std.user\" role to any user who should have the ability to add or manage subscriptions in Mattermost channels.\n- Go to ServiceNow and search for Users.\n- On the Users page, open any user's profile. \n- Click on \"Roles\" tab in the table present below and click on \"Edit\"\n- Then, search for the \"x_830655_mm_std.user\" role and add that role to the user's Roles list and click on \"Save\".\n\nAfter that, this user will have the permission to add or manage subscriptions from Mattermost.\n",
		},
		{
			description: "ExecuteCommand: Unknown action",
			setupAPI:    func(a *plugintest.API) {},
			setupPlugin: func() {
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "IsAuthorizedSysAdmin", func(*Plugin, string) (bool, error) {
					return true, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
					return &serializer.User{}, nil
				})
				setMockConfigurations(&p)
			},
			args: &model.CommandArgs{
				Command: "/servicenow invalid",
				UserId:  userID,
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
				UserId:  userID,
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
			assert.EqualValues(testCase.expectedError, err)
		})
	}
}

func TestCheckConnected(t *testing.T) {
	defer monkey.UnpatchAll()
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
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
			description: "CheckConnected: Unable to get user",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			errorMessage:     errors.New("mockError"),
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			monkey.PatchInstanceMethod(reflect.TypeOf(&p), "GetUser", func(*Plugin, string) (*serializer.User, error) {
				return &serializer.User{}, testCase.errorMessage
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
			description: "GetClientFromUser: Unable to parse token",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			errorMessage:     errors.New("mockError"),
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
				OAuth2Token: "mockOAuth2Token",
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
		UserId: "mockUserID",
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
			description: "HandleDisconnect: Unable to disconnect user",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			expectedResponse: disconnectErrorMessage,
			errorMessage:     errors.New("mockError"),
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

			resp := p.handleDisconnect(&plugin.Context{}, args, []string{}, mock_plugin.NewClient(t), true)

			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleSubscriptions(t *testing.T) {
	p := Plugin{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
	}
	for _, testCase := range []struct {
		description      string
		params           []string
		expectedResponse string
	}{
		{
			description:      "HandleSubscriptions: Invalid number of params",
			expectedResponse: "Invalid subscribe command. Available commands are 'list', 'add', 'edit' and 'delete'.",
		},
		{
			description:      "HandleSubscriptions: Unknown command",
			params:           []string{"invalidCommand"},
			expectedResponse: "Unknown subcommand invalidCommand",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			assert := assert.New(t)
			resp := p.handleSubscriptions(&plugin.Context{}, args, testCase.params, mock_plugin.NewClient(t), true)
			assert.EqualValues(testCase.expectedResponse, resp)
		})
	}
}

func TestHandleSubscribe(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
	}
	for _, testCase := range []struct {
		description   string
		setupAPI      func(*plugintest.API)
		expectedError string
	}{
		{
			description: "HandleSubscribe: Success",
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			resp := p.handleSubscribe(&plugin.Context{}, args, []string{}, mock_plugin.NewClient(t), true)

			assert.EqualValues(testCase.expectedError, resp)
		})
	}
}

func TestHandleSearchAndShare(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
	}
	for _, testCase := range []struct {
		description   string
		setupAPI      func(*plugintest.API)
		expectedError string
	}{
		{
			description: "HandleSearchAndShare: Success",
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			resp := p.handleSearchAndShare(&plugin.Context{}, args, []string{}, mock_plugin.NewClient(t), true)

			assert.EqualValues(testCase.expectedError, resp)
		})
	}
}

func TestHandleListSubscriptions(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId:    "mockUserID",
		ChannelId: "mockChannelID",
	}
	mockSysID := "mockSysID"
	mockNumber := "mockNumber"
	mockChannelID := "mockChannelID"
	mockUser := "mockUser"
	mockDescription := "mockDescription"
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
			description:   "HandleListSubscriptions: Invalid number of params",
			params:        []string{"invalid"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			expectedError: "Unknown filter invalid",
		},
		{
			description:   "HandleListSubscriptions: Invalid number of params 2",
			params:        []string{"me", "invalid"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			expectedError: "Unknown filter invalid",
		},
		{
			description: "HandleListSubscriptions: Unable to get subscriptions",
			params:      []string{"me", "all_channels"},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					nil, 0, errors.New("mockError"),
				)
			},
			isResponse:       true,
			expectedResponse: genericErrorMessage,
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: No subscriptions present",
			params:      []string{"me", "all_channels"},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					[]*serializer.SubscriptionResponse{}, 0, nil,
				)
			},
			isResponse:       true,
			expectedResponse: "You don't have any active subscriptions for this channel.",
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: Unable to get user and channel",
			params:      []string{"me", "all_channels"},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError(),
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					nil, testutils.GetInternalServerAppError(),
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					[]*serializer.SubscriptionResponse{
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
					}, 0, nil,
				)
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					&serializer.ServiceNowRecord{
						Number:           mockNumber,
						ShortDescription: mockDescription,
					}, 0, nil,
				)
			},
			isResponse:       true,
			expectedResponse: "#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel |\n| :----|:--------| :--------|:--------|:--------|\n|mockSysID|Incident|State changed|N/A|N/A|\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|mockSysID|Incident|mockNumber|mockDescription|State changed|N/A|N/A|",
			expectedError:    listSubscriptionsWaitMessage,
		},
		{
			description: "HandleListSubscriptions: Success",
			params:      []string{"me", "all_channels"},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", mock.AnythingOfType("string")).Return(
					&model.User{Username: "mockUsername"}, nil,
				)
				a.On("GetChannel", mock.AnythingOfType("string")).Return(
					testutils.GetChannel(model.CHANNEL_PRIVATE), nil,
				)
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetAllSubscriptions", testutils.GetMockArgumentsWithType("string", 5)...).Return(
					[]*serializer.SubscriptionResponse{
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
					}, 0, nil,
				)
				client.On("GetRecordFromServiceNow", testutils.GetMockArgumentsWithType("string", 2)...).Return(
					&serializer.ServiceNowRecord{
						Number:           mockNumber,
						ShortDescription: mockDescription,
					}, 0, nil,
				)
			},
			isResponse:       true,
			expectedResponse: "#### Bulk subscriptions\n| Subscription ID | Record Type | Events | Created By | Channel |\n| :----|:--------| :--------|:--------|:--------|\n|mockSysID|Incident|State changed|N/A|N/A|\n#### Record subscriptions\n| Subscription ID | Record Type | Record Number | Record Short Description | Events | Created By | Channel |\n| :----|:--------| :--------| :-----| :--------|:--------|:--------|\n|mockSysID|Incident|mockNumber|mockDescription|State changed|N/A|N/A|",
			expectedError:    listSubscriptionsWaitMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			// wg := sync.WaitGroup{}
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

			// wg.Add(1)
			resp := p.handleListSubscriptions(&plugin.Context{}, args, testCase.params, c, true)
			time.Sleep(100 * time.Millisecond)
			// defer wg.Done()
			// wg.Wait()
			assert.EqualValues(testCase.expectedError, resp)
		})
	}
}

func TestHandleDeleteSubscription(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
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
			params:      []string{"efe53526975a1110f357bfb3f153afa1"},
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", "efe53526975a1110f357bfb3f153afa1").Return(
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
			expectedError: "Invalid number of params for this command.",
		},
		{
			description:      "HandleDeleteSubscription: Invalid subsrciption ID",
			params:           []string{"invalidID"},
			setupAPI:         func(a *plugintest.API) {},
			setupClient:      func(client *mock_plugin.Client) {},
			isResponse:       true,
			expectedResponse: invalidSubscriptionIDMessage,
			expectedError:    genericWaitMessage,
		},
		{
			description: "HandleDeleteSubscription: Unable to delete subsrciption",
			params:      []string{"efe53526975a1110f357bfb3f153afa1"},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("DeleteSubscription", "efe53526975a1110f357bfb3f153afa1").Return(
					0, errors.New("mockError"),
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

			resp := p.handleDeleteSubscription(&plugin.Context{}, args, testCase.params, c, true)
			assert.EqualValues(testCase.expectedError, resp)
			time.Sleep(100 * time.Millisecond)
		})
	}
}

func TestHandleEditSubscription(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	args := &model.CommandArgs{
		UserId: "mockUserID",
	}
	for _, testCase := range []struct {
		description   string
		params        []string
		setupAPI      func(*plugintest.API)
		setupClient   func(client *mock_plugin.Client)
		expectedError string
	}{
		{
			description: "HandleEditSubscription: Success",
			params:      []string{"efe53526975a1110f357bfb3f153afa1"},
			setupAPI: func(a *plugintest.API) {
				a.On("PublishWebSocketEvent", mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("*model.WebsocketBroadcast")).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetSubscription", "efe53526975a1110f357bfb3f153afa1").Return(
					&serializer.SubscriptionResponse{
						Type: constants.SubscriptionTypeBulk,
					}, 0, nil,
				)
			},
		},
		{
			description:   "HandleEditSubscription: Invalid number of params",
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			expectedError: "Invalid number of params for this command.",
		},
		{
			description:   "HandleEditSubscription: Invalid subsrciption ID",
			params:        []string{"invalidID"},
			setupAPI:      func(a *plugintest.API) {},
			setupClient:   func(client *mock_plugin.Client) {},
			expectedError: invalidSubscriptionIDMessage,
		},
		{
			description: "HandleEditSubscription: Unable to get subsrciption",
			params:      []string{"efe53526975a1110f357bfb3f153afa1"},
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
			},
			setupClient: func(client *mock_plugin.Client) {
				client.On("GetSubscription", "efe53526975a1110f357bfb3f153afa1").Return(
					nil, 0, errors.New("mockError"),
				)
			},
			expectedError: genericErrorMessage,
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			defer mockAPI.AssertExpectations(t)
			assert := assert.New(t)
			c := mock_plugin.NewClient(t)
			testCase.setupAPI(mockAPI)
			testCase.setupClient(c)
			p.SetAPI(mockAPI)

			resp := p.handleEditSubscription(&plugin.Context{}, args, testCase.params, c, true)

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
			description:        "ParseCommand: command 1",
			input:              " /servicenow subscriptions   list  me  all_channels ",
			expectedAction:     "subscriptions",
			expectedParameters: []string{"list", "me", "all_channels"},
		},
		{
			description:        "ParseCommand: command 2",
			input:              "/servicenow subscriptions add",
			expectedAction:     "subscriptions",
			expectedParameters: []string{"add"},
		},
		{
			description:        "ParseCommand: command 3",
			input:              "/servicenow subscriptions edit mockID",
			expectedAction:     "subscriptions",
			expectedParameters: []string{"edit", "mockID"},
		},
		{
			description:        "ParseCommand: command 4",
			input:              "     /servicenow       subscriptions      delete     mockID    ",
			expectedAction:     "subscriptions",
			expectedParameters: []string{"delete", "mockID"},
		},
		{
			description:    "ParseCommand: command 5",
			input:          "/servicenow share",
			expectedAction: "share",
		},
		{
			description:    "ParseCommand: command 6",
			input:          "/servicenow connect",
			expectedAction: "connect",
		},
		{
			description:    "ParseCommand: command 6",
			input:          "/servicenow disconnect",
			expectedAction: "disconnect",
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
