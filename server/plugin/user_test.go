package plugin

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"bou.ke/monkey"
	mock_plugin "github.com/Brightscout/mattermost-plugin-servicenow/server/mocks"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

func TestInitOAuth2(t *testing.T) {
	for _, test := range []struct {
		description          string
		setupStore           func(*mock_plugin.Store)
		expectedErrorMessage string
	}{
		{
			description: "User is already connected to ServiceNow",
			setupStore: func(s *mock_plugin.Store) {
				s.On("LoadUser", testutils.GetID()).Return(nil, nil)
			},
			expectedErrorMessage: "user is already connected to ServiceNow",
		},
		{
			description: "OAuth2 configuration URL is returned successfully",
			setupStore: func(s *mock_plugin.Store) {
				s.On("LoadUser", testutils.GetID()).Return(nil, fmt.Errorf("mockErrMessage"))
				s.On("StoreOAuth2State", mock.AnythingOfType("string")).Return(nil)
			},
		},
		{
			description: "Error occurred while storing oauth2 state",
			setupStore: func(s *mock_plugin.Store) {
				s.On("LoadUser", testutils.GetID()).Return(nil, fmt.Errorf("mockErrMessage"))
				s.On("StoreOAuth2State", mock.AnythingOfType("string")).Return(fmt.Errorf("mockErrMessage"))
			},
			expectedErrorMessage: "mockErrMessage",
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			p := Plugin{}
			store := mock_plugin.NewStore(t)

			test.setupStore(store)
			p.store = store

			res, err := p.InitOAuth2(testutils.GetID())
			if test.expectedErrorMessage != "" {
				require.Equal(t, "", res)
				require.NotNil(t, err)
				require.Equal(t, test.expectedErrorMessage, err.Error())
			} else {
				require.Nil(t, err)
				require.NotEqual(t, "", res)
			}
		})
	}
}

func TestCompleteOAuth2(t *testing.T) {
	for name, test := range map[string]struct {
		authenticatedUserID  string
		code                 string
		state                string
		setupStore           func(*mock_plugin.Store)
		setupAPI             func(*plugintest.API)
		setupPlugin          func(*Plugin)
		expectedErrorMessage string
	}{
		"success": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(nil)
				s.On("StoreUser", mock.AnythingOfType("*serializer.User")).Return(nil)
			},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", "mockUserID").Return(&model.User{}, nil)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(&oauth2.Config{}), "Exchange", func(_ *oauth2.Config, _ context.Context, _ string, _ ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
					return &oauth2.Token{}, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "NewEncodedAuthToken", func(_ *Plugin, _ *oauth2.Token) (string, error) {
					return "mockToken", nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "DM", func(_ *Plugin, _, _ string, _ ...interface{}) (string, error) {
					return "", nil
				})
			},
		},
		"missing userID, code or state": {
			authenticatedUserID:  "",
			setupStore:           func(s *mock_plugin.Store) {},
			setupAPI:             func(a *plugintest.API) {},
			setupPlugin:          func(p *Plugin) {},
			expectedErrorMessage: "missing user, code or state",
		},
		"failed to verify state": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(fmt.Errorf("failed to verify state"))
			},
			setupAPI:             func(a *plugintest.API) {},
			setupPlugin:          func(p *Plugin) {},
			expectedErrorMessage: "failed to verify state",
		},
		"failed to match user ID": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUser",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUser").Return(nil)
			},
			setupAPI:             func(a *plugintest.API) {},
			setupPlugin:          func(p *Plugin) {},
			expectedErrorMessage: "mismatch",
		},
		"failed to get Mattermost user": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(nil)
			},
			setupAPI: func(a *plugintest.API) {
				err := testutils.GetBadRequestAppError()
				err.Message = "failed to get MM user"
				a.On("GetUser", "mockUserID").Return(nil, err)
			},
			setupPlugin:          func(p *Plugin) {},
			expectedErrorMessage: "failed to get MM user",
		},
		"failed to exchange token": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(nil)
			},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", "mockUserID").Return(&model.User{}, nil)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(&oauth2.Config{}), "Exchange", func(_ *oauth2.Config, _ context.Context, _ string, _ ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
					return nil, fmt.Errorf("failed to exchange token")
				})
			},
			expectedErrorMessage: "failed to exchange token",
		},
		"failed to encrypt token": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(nil)
			},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", "mockUserID").Return(&model.User{}, nil)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(&oauth2.Config{}), "Exchange", func(_ *oauth2.Config, _ context.Context, _ string, _ ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
					return &oauth2.Token{}, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "NewEncodedAuthToken", func(_ *Plugin, _ *oauth2.Token) (string, error) {
					return "", fmt.Errorf("encryption error")
				})
			},
			expectedErrorMessage: "encryption error",
		},
		"failed to store user": {
			authenticatedUserID: "mockUserID",
			code:                "mockCode",
			state:               "mockState_mockUserID",
			setupStore: func(s *mock_plugin.Store) {
				s.On("VerifyOAuth2State", "mockState_mockUserID").Return(nil)
				s.On("StoreUser", mock.AnythingOfType("*serializer.User")).Return(fmt.Errorf("failed to store user"))
			},
			setupAPI: func(a *plugintest.API) {
				a.On("GetUser", "mockUserID").Return(&model.User{}, nil)
			},
			setupPlugin: func(p *Plugin) {
				monkey.PatchInstanceMethod(reflect.TypeOf(&oauth2.Config{}), "Exchange", func(_ *oauth2.Config, _ context.Context, _ string, _ ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
					return &oauth2.Token{}, nil
				})
				monkey.PatchInstanceMethod(reflect.TypeOf(p), "NewEncodedAuthToken", func(_ *Plugin, _ *oauth2.Token) (string, error) {
					return "mockToken", nil
				})
			},
			expectedErrorMessage: "failed to store user",
		},
	} {
		t.Run(name, func(t *testing.T) {
			api := &plugintest.API{}
			store := mock_plugin.NewStore(t)
			test.setupStore(store)
			test.setupAPI(api)
			defer monkey.UnpatchAll()
			defer api.AssertExpectations(t)

			p := setupTestPlugin(api, store)
			test.setupPlugin(p)
			err := p.CompleteOAuth2(test.authenticatedUserID, test.code, test.state)
			if test.expectedErrorMessage != "" {
				require.NotNil(t, err)
				require.Contains(t, err.Error(), test.expectedErrorMessage)
			} else {
				require.Nil(t, err)
			}
		})
	}
}
