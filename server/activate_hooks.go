package main

import (
	"path/filepath"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"
)

func (p *Plugin) OnActivate() error {
	if err := p.initBotUser(); err != nil {
		return err
	}

	if err := p.OnConfigurationChange(); err != nil {
		return err
	}

	command, err := p.getCommand()
	if err != nil {
		return errors.Wrap(err, "failed to get command")
	}

	err = p.API.RegisterCommand(command)
	if err != nil {
		return errors.Wrap(err, "failed to register command")
	}

	p.router = p.InitAPI()
	p.store = p.NewStore()
	sqlSettings := p.API.GetUnsanitizedConfig().SqlSettings
	p.store.Connect(sqlSettings)
	return nil
}

func (p *Plugin) OnDeactivate() error {
	if p.store != nil {
		p.store.Disconnect()
	}

	return nil
}

func (p *Plugin) initBotUser() error {
	botID, err := p.Helpers.EnsureBot(&model.Bot{
		Username:    constants.BotUserName,
		DisplayName: constants.BotDisplayName,
		Description: constants.BotDescription,
	}, plugin.ProfileImagePath(filepath.Join("assets", "profile.png")))
	if err != nil {
		return errors.Wrap(err, "failed to ensure bot")
	}

	p.botID = botID
	return nil
}
