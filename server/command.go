package main

import (
	"context"
	"fmt"
	"strings"
	"unicode"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/Brightscout/mattermost-plugin-servicenow/server/serializer"
	"github.com/mattermost/mattermost-plugin-api/experimental/command"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"
)

const (
	commandHelp = `* |/servicenow connect| - Connect your Mattermost account to your ServiceNow account
* |/servicenow disconnect| - Disconnect your Mattermost account from your ServiceNow account
* |/servicenow subscribe| - Subscribe to the notifications of record changes in ServiceNow
* |/servicenow list| - List your subscriptions for the current channel
`
	subscribeErrorMessage         = "Something went wrong. Not able to subscribe. Check server logs for errors."
	subscribeSuccessMessage       = "Subscription successfully created."
	listSubscriptionsErrorMessage = "Something went wrong. Not able to list subscriptions. Check server logs for errors."
)

type CommandHandleFunc func(c *plugin.Context, args *model.CommandArgs, parameters []string) string

func (p *Plugin) getCommand() (*model.Command, error) {
	iconData, err := command.GetIconData(p.API, "assets/icon.svg")
	if err != nil {
		return nil, errors.Wrap(err, "failed to get icon data")
	}

	return &model.Command{
		Trigger:              constants.CommandTrigger,
		AutoComplete:         true,
		AutoCompleteDesc:     "Available commands: connect, disconnect, subscribe, list, help",
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

	p.postCommandResponse(args, fmt.Sprintf("Unknown action `%v`", action))
	return &model.CommandResponse{}, nil
}

func (p *Plugin) handleHelp(_ *plugin.Context, _ *model.CommandArgs, _ []string) string {
	return "###### Mattermost ServiceNow Plugin - Slash Command Help\n" + strings.ReplaceAll(commandHelp, "|", "`")
}

func (p *Plugin) handleConnect(_ *plugin.Context, args *model.CommandArgs, _ []string) string {
	if _, err := p.GetUser(args.UserId); err == nil {
		return "You are already connected to ServiceNow."
	}
	return fmt.Sprintf("[Click here to link your ServiceNow account.](%s%s)", p.GetPluginURL(), constants.PathOAuth2Connect)
}

func (p *Plugin) handleDisconnect(_ *plugin.Context, args *model.CommandArgs, _ []string) string {
	disconnectErrorMessage := "Something went wrong. Not able to disconnect user. Check server logs for errors."
	if _, err := p.GetUser(args.UserId); err != nil {
		if errors.Is(err, ErrNotFound) {
			return "You are not connected to ServiceNow."
		}
		p.API.LogError("Unable to get user", "Error", err.Error())
		return disconnectErrorMessage
	}
	if err := p.DisconnectUser(args.UserId); err != nil {
		p.API.LogError("Unable to disconnect user", "Error", err.Error())
		return disconnectErrorMessage
	}
	return "Disconnected your ServiceNow account."
}

func (p *Plugin) handleSubscribe(_ *plugin.Context, args *model.CommandArgs, params []string) string {
	user, err := p.GetUser(args.UserId)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return "You are not connected to ServiceNow."
		}
		p.API.LogError("Unable to get user", "Error", err.Error())
		return subscribeErrorMessage
	}

	if len(params) < 2 {
		return "You have not entered the correct number of arguments for the subscribe command."
	}

	// TODO: Add logic to open the create subscription modal
	// The below code is temporary and it'll be removed in the future.
	token, err := p.ParseAuthToken(user.OAuth2Token)
	if err != nil {
		p.API.LogError("Unable to parse oauth token", "Error", err.Error())
		return subscribeErrorMessage
	}

	client := p.NewClient(context.Background(), token)
	subscription := serializer.SubscriptionPayload{
		ServerURL:        p.getConfiguration().MattermostSiteURL,
		UserID:           args.UserId,
		ChannelID:        args.ChannelId,
		RecordType:       params[0],
		RecordID:         params[1],
		SubscriptionType: constants.SubscriptionTypePriority,
		IsActive:         true,
		Level:            constants.SubscriptionLevelRecord,
	}
	if err = subscription.IsValid(); err != nil {
		p.API.LogError("Failed to validate subscription", "Error", err.Error())
		return subscribeErrorMessage
	}

	if err = client.CreateSubscription(&subscription); err != nil {
		p.API.LogError("Unable to create subscription", "Error", err.Error())
		return subscribeErrorMessage
	}
	return subscribeSuccessMessage
}

func (p *Plugin) handleListSubscriptions(_ *plugin.Context, args *model.CommandArgs, _ []string) string {
	user, err := p.GetUser(args.UserId)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return "You are not connected to ServiceNow."
		}
		p.API.LogError("Unable to get user", "Error", err.Error())
		return listSubscriptionsErrorMessage
	}

	token, err := p.ParseAuthToken(user.OAuth2Token)
	if err != nil {
		p.API.LogError("Unable to parse oauth token", "Error", err.Error())
		return listSubscriptionsErrorMessage
	}

	client := p.NewClient(context.Background(), token)
	subscriptions, err := client.GetSubscriptions(args.UserId, args.ChannelId, fmt.Sprint(constants.DefaultPerPage), fmt.Sprint(constants.DefaultPage))
	if err != nil {
		p.API.LogError("Unable to get subscriptions", "Error", err.Error())
		return listSubscriptionsErrorMessage
	}

	if len(subscriptions) == 0 {
		return "You don't have any subscriptions active for this channel."
	}
	return ParseSubscriptionsToCommandResponse(subscriptions)
}

func getAutocompleteData() *model.AutocompleteData {
	serviceNow := model.NewAutocompleteData(constants.CommandTrigger, "[command]", "Available commands: connect, disconnect, help")

	connect := model.NewAutocompleteData("connect", "", "Connect your Mattermost account to your ServiceNow account")
	serviceNow.AddCommand(connect)

	disconnect := model.NewAutocompleteData("disconnect", "", "Disconnect your Mattermost account from your ServiceNow account")
	serviceNow.AddCommand(disconnect)

	subscribe := model.NewAutocompleteData("subscribe", "[record_type] [record_id]", "Subscribe to the notifications of record changes in ServiceNow")
	subscribe.AddTextArgument("Type of the record for subscription. Can be one of: problem, incident, change_request", "[record_type]", "")
	subscribe.AddTextArgument("ID of the record to subscribe to. It is referred as sys_id in ServiceNow.", "[record_id]", "")
	serviceNow.AddCommand(subscribe)

	list := model.NewAutocompleteData("list", "", "List your subscriptions for the current channel")
	serviceNow.AddCommand(list)

	help := model.NewAutocompleteData("help", "", "Display slash command help text")
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
