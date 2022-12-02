package plugin

import (
	"path/filepath"

	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
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

	if err = p.API.RegisterCommand(command); err != nil {
		return errors.Wrap(err, "failed to register command")
	}

	p.router = p.InitAPI()
	p.store = p.NewStore(p.API)
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
