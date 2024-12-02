package plugin

import (
	"fmt"

	"github.com/mattermost/mattermost/server/public/model"
)

// Ephemeral sends an ephemeral message to a user
func (p *Plugin) Ephemeral(userID, channelID, rootID, format string, args ...interface{}) {
	post := &model.Post{
		UserId:    p.botID,
		ChannelId: channelID,
		RootId:    rootID,
		Message:   fmt.Sprintf(format, args...),
	}
	_ = p.API.SendEphemeralPost(userID, post)
}

// DM posts a simple Direct Message to the specified user
func (p *Plugin) DM(mattermostUserID, format string, args ...interface{}) (string, error) {
	channel, err := p.API.GetDirectChannel(mattermostUserID, p.botID)
	if err != nil {
		p.API.LogError("Couldn't get bot's DM channel", "user_id", mattermostUserID, "error", err.Error())
		return "", err
	}
	post := &model.Post{
		ChannelId: channel.Id,
		UserId:    p.botID,
		Message:   fmt.Sprintf(format, args...),
	}
	sentPost, err := p.API.CreatePost(post)
	if err != nil {
		p.API.LogError("Error occurred while creating post", "error", err.Error())
		return "", err
	}
	return sentPost.Id, nil
}
