// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugin

import (
	"path/filepath"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/pluginapi"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
)

func (p *Plugin) OnActivate() error {
	if p.client == nil {
		p.client = pluginapi.NewClient(p.API, p.Driver)
	}

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

	if err = p.API.RegisterCommand(command); err != nil {
		return errors.Wrap(err, "failed to register command")
	}

	p.router = p.InitAPI()
	p.store = p.NewStore(p.API)
	p.initializeTelemetry()

	return nil
}

func (p *Plugin) OnDeactivate() error {
	if err := p.telemetryClient.Close(); err != nil {
		p.API.LogWarn("Telemetry client failed to close", "error", err.Error())
	}
	return nil
}

func (p *Plugin) initBotUser() error {
	botID, err := p.client.Bot.EnsureBot(&model.Bot{
		Username:    constants.BotUserName,
		DisplayName: constants.BotDisplayName,
		Description: constants.BotDescription,
	}, pluginapi.ProfileImagePath(filepath.Join("assets", "profile.png")))
	if err != nil {
		return errors.Wrap(err, "failed to ensure bot")
	}

	p.botID = botID
	return nil
}
