package plugin

import (
	"testing"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/testutils"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v5/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
)

func TestDM(t *testing.T) {
	p := Plugin{}
	for _, testCase := range []struct {
		description    string
		mockChannelErr *model.AppError
		mockPostErr    *model.AppError
	}{
		{
			description: "DM: message is successfully posted",
		},
		{
			description:    "DM: channel is not found",
			mockChannelErr: &model.AppError{},
		},
		{
			description: "DM: error in CreatePost method",
			mockPostErr: &model.AppError{},
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			mockAPI := &plugintest.API{}
			mockAPI.On("LogError", testutils.GetMockArgumentsWithType("string", 5)...).Return("LogInfo error")
			mockAPI.On("LogError", testutils.GetMockArgumentsWithType("string", 3)...).Return("LogError error")
			mockAPI.On("GetDirectChannel", mock.Anything, mock.Anything).Return(&model.Channel{}, testCase.mockChannelErr)
			mockAPI.On("CreatePost", mock.Anything).Return(&model.Post{}, testCase.mockPostErr)

			p.SetAPI(mockAPI)

			_, err := p.DM("mockUserID", "mockFormat")

			if testCase.mockChannelErr != nil || testCase.mockPostErr != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestEphemeral(t *testing.T) {
	p := Plugin{}
	mockAPI := &plugintest.API{}
	for _, testCase := range []struct {
		description string
	}{
		{
			description: "Ephemeral: post is successfully created",
		},
	} {
		t.Run(testCase.description, func(t *testing.T) {
			mockAPI.On("SendEphemeralPost", mock.Anything, mock.Anything).Return(&model.Post{})

			p.SetAPI(mockAPI)

			p.Ephemeral("mockUserID", "mockChannelID", "mockRootID", "mockFormat")

			mockAPI.AssertNumberOfCalls(t, "SendEphemeralPost", 1)
		})
	}
}
