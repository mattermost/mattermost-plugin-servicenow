package plugin

import (
	"testing"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin/plugintest"
	"github.com/mattermost/mattermost/server/public/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-servicenow/server/testutils"
)

func TestDM(t *testing.T) {
	p := Plugin{}
	for _, testCase := range []struct {
		description   string
		setupAPI      func(*plugintest.API)
		expectedError string
	}{
		{
			description: "DM: message is successfully posted",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				a.On("GetDirectChannel", mock.Anything, mock.Anything).Return(testutils.GetChannel(model.ChannelTypePrivate), nil)
				a.On("CreatePost", mock.Anything).Return(testutils.GetPost(), nil)
			},
		},
		{
			description: "DM: channel is not found",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
				a.On("GetDirectChannel", mock.Anything, mock.Anything).Return(testutils.GetChannel(model.ChannelTypePrivate), testutils.GetInternalServerAppError())
			},
			expectedError: "channel not found",
		},
		{
			description: "DM: error in CreatePost method",
			setupAPI: func(a *plugintest.API) {
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return()
				a.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return()
				a.On("GetDirectChannel", mock.Anything, mock.Anything).Return(testutils.GetChannel(model.ChannelTypePrivate), nil)
				a.On("CreatePost", mock.Anything).Return(testutils.GetPost(), testutils.GetInternalServerAppError())
			},
			expectedError: "error in creating the post",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			mockAPI := &plugintest.API{}
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)

			resp, err := p.DM("mockUserID", "mockFormat")

			if testCase.expectedError != "" {
				assert.Error(t, err)
				assert.Equal(t, resp, "")
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}

func TestEphemeral(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	for _, testCase := range []struct {
		description string
		setupAPI    func(*plugintest.API)
	}{
		{
			description: "Ephemeral: post is successfully created",
			setupAPI: func(a *plugintest.API) {
				a.On("SendEphemeralPost", mock.Anything, mock.Anything).Return(testutils.GetPost())
			},
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			testCase.setupAPI(mockAPI)
			p.SetAPI(mockAPI)
			p.Ephemeral("mockUserID", "mockChannelID", "mockRootID", "mockFormat")

			mockAPI.AssertNumberOfCalls(t, "SendEphemeralPost", 1)
		})
	}
}
