package main

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-api/experimental/command"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"
)

const commandHelp = `* |/servicenow connect| - Connect your Mattermost account to your ServiceNow account
* |/servicenow disconnect| - Disconnect your Mattermost account from your ServiceNow account
* |/servicenow subscriptions list| - Will list the current channel subscriptions
`

type CommandHandleFunc func(c *plugin.Context, args *model.CommandArgs, parameters []string) string

func (p *Plugin) getCommand() (*model.Command, error) {
	iconData, err := command.GetIconData(p.API, "assets/icon.svg")
	if err != nil {
		return nil, errors.Wrap(err, "failed to get icon data")
	}

	return &model.Command{
		Trigger:              constants.CommandTrigger,
		AutoComplete:         true,
		AutoCompleteDesc:     "Available commands: connect, disconnect, help",
		AutoCompleteHint:     "[command]",
		AutocompleteData:     getAutocompleteData(),
		AutocompleteIconData: iconData,
	}, nil
}

func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	command, action, parameters := parseCommand(args.Command)

	if command != fmt.Sprintf("/%s", constants.CommandTrigger) {
		return &model.CommandResponse{}, nil
	}

	config := p.getConfiguration()
	if validationErr := config.IsValid(); validationErr != nil {
		isSysAdmin, err := p.isAuthorizedSysAdmin(args.UserId)
		var text string
		switch {
		case err != nil:
			text = "Error checking user's permissions"
			p.API.LogWarn(text, "error", err.Error())
		case isSysAdmin:
			text = fmt.Sprintf("Before using this plugin, you'll need to configure it in the System Console`: %s", validationErr.Error())
		default:
			text = "Please contact your system administrator to correctly configure the ServiceNow plugin."
		}

		p.postCommandResponse(args, text)
		return &model.CommandResponse{}, nil
	}

	if f, ok := p.CommandHandlers[action]; ok {
		message := f(c, args, parameters)
		if message != "" {
			p.postCommandResponse(args, message)
		}
		return &model.CommandResponse{}, nil
	}

	p.postCommandResponse(args, fmt.Sprintf("Unknown action %v", action))
	return &model.CommandResponse{}, nil
}

func (p *Plugin) handleHelp(_ *plugin.Context, _ *model.CommandArgs, _ []string) string {
	return "###### Mattermost ServiceNow Plugin - Slash Command Help\n" + strings.ReplaceAll(commandHelp, "|", "`")
}

func (p *Plugin) handleConnect(_ *plugin.Context, args *model.CommandArgs, _ []string) string {
	if _, err := p.GetUser(args.UserId); err == nil {
		return "User is already connected to ServiceNow."
	}
	return fmt.Sprintf("[Click here to link your ServiceNow account.](%s%s)", p.GetPluginURL(), constants.PathOAuth2Connect)
}

func (p *Plugin) handleDisconnect(_ *plugin.Context, args *model.CommandArgs, _ []string) string {
	if err := p.DisconnectUser(args.UserId); err != nil {
		p.API.LogError("Unable to disconnect user", "Error", err.Error())
		return "Something went wrong. Not able to disconnect user. Check server logs for errors."
	}
	return "Disconnected your ServiceNow account."
}

func getAutocompleteData() *model.AutocompleteData {
	serviceNow := model.NewAutocompleteData(constants.CommandTrigger, "[command]", "Available commands: connect, disconnect, help")

	connect := model.NewAutocompleteData("connect", "", "Connect your Mattermost account to your ServiceNow account")
	serviceNow.AddCommand(connect)

	disconnect := model.NewAutocompleteData("disconnect", "", "Disconnect your Mattermost account from your ServiceNow account")
	serviceNow.AddCommand(disconnect)

	help := model.NewAutocompleteData("help", "", "Display Slash Command help text")
	serviceNow.AddCommand(help)

	return serviceNow
}

// parseCommand parses the entire command input string and retrieves the command, action and parameters
func parseCommand(input string) (command, action string, parameters []string) {
	split := make([]string, 0)
	current := ""
	inQuotes := false

	for _, char := range input {
		if unicode.IsSpace(char) {
			// keep whitespaces that are inside double qoutes
			if inQuotes {
				current += " "
				continue
			}

			// ignore successive whitespaces that are outside of double quotes
			if len(current) == 0 && !inQuotes {
				continue
			}

			// append the current word to the list & move on to the next word/expression
			split = append(split, current)
			current = ""
			continue
		}

		// append the current character to the current word
		current += string(char)

		if char == '"' {
			inQuotes = !inQuotes
		}
	}

	// append the last word/expression to the list
	if len(current) > 0 {
		split = append(split, current)
	}

	command = split[0]

	if len(split) > 1 {
		action = split[1]
	}

	if len(split) > 2 {
		parameters = split[2:]
	}

	return command, action, parameters
}

func (p *Plugin) postCommandResponse(args *model.CommandArgs, text string) {
	p.Ephemeral(args.UserId, args.ChannelId, args.RootId, text)
}

func (p *Plugin) isAuthorizedSysAdmin(userID string) (bool, error) {
	user, appErr := p.API.GetUser(userID)
	if appErr != nil {
		return false, appErr
	}
	if !strings.Contains(user.Roles, "system_admin") {
		return false, nil
	}
	return true, nil
}
