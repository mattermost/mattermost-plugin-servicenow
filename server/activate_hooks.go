package main

import (
	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/pkg/errors"
)

func (p *Plugin) OnActivate() error {
	if err := p.initBotUser(); err != nil {
		return err
	}

	if err := p.OnConfigurationChange(); err != nil {
		return err
	}

	p.router = p.InitAPI()
	return nil
}

func (p *Plugin) initBotUser() error {
	botID, err := p.Helpers.EnsureBot(&model.Bot{
		Username:    constants.BotUserName,
		DisplayName: constants.BotDisplayName,
		Description: constants.BotDescription,
	})
	if err != nil {
		return errors.Wrap(err, "failed to ensure bot")
	}

	p.botID = botID
	return nil
}
