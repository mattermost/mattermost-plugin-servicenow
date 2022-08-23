package main

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"unicode"

	"github.com/Brightscout/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-api/experimental/command"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
	"github.com/pkg/errors"
)

const (
	commandHelp = `##### Slash Commands
* |/servicenow connect| - Connect your Mattermost account to your ServiceNow account
* |/servicenow disconnect| - Disconnect your Mattermost account from your ServiceNow account
* |/servicenow subscriptions| - Manage your subscriptions to the record changes in ServiceNow
* |/servicenow help| - Know about the features of this plugin
`

	commandHelpForAdmin = commandHelp + "\n\n" + `##### Configure/Enable subscriptions
* Download the update set XML file from **System Console > Plugins > ServiceNow Plugin > Download ServiceNow Update Set**.
* Go to ServiceNow and search for Update sets. Then go to "Retrieved Update Sets" under "System Update Sets".
* Click on "Import Update Set from XML" link.
* Choose the downloaded XML file from the plugin's config and upload that file.
* You will be back on the "Retrieved Update Sets" page and you'll be able to see an update set named "ServiceNow for Mattermost Notifications".
* Click on that update set and then click on "Preview Update Set".
* After the preview is complete, you have to commit the update set by clicking on the button "Commit Update Set".
* You'll see a warning dialog. You can ignore that and click on "Proceed with Commit".

##### Setting up user permissions in ServiceNow
Within ServiceNow user roles, add the "x_830655_mm_std.user" role to any user who should have the ability to add or manage subscriptions in Mattermost channels.
- Go to ServiceNow and search for Users.
- On the Users page, open any user's profile. 
- Click on "Roles" tab in the table present below and click on "Edit"
- Then, search for the "x_830655_mm_std.user" role and add that role to the user's Roles list and click on "Save".

After that, this user will have the permission to add or manage subscriptions from Mattermost.
`

	helpCommandHeader                       = "#### Mattermost ServiceNow Plugin - Slash Command Help\n"
	disconnectErrorMessage                  = "Something went wrong. Not able to disconnect user. Check server logs for errors."
	disconnectSuccessMessage                = "Disconnected your ServiceNow account."
	listSubscriptionsErrorMessage           = "Something went wrong. Not able to list subscriptions. Check server logs for errors."
	listSubscriptionsWaitMessage            = "Your subscriptions for this channel will be listed soon. Please wait."
	deleteSubscriptionErrorMessage          = "Something went wrong. Not able to delete subscription. Check server logs for errors."
	deleteSubscriptionSuccessMessage        = "Subscription successfully deleted."
	editSubscriptionErrorMessage            = "Something went wrong. Check server logs for errors."
	unknownErrorMessage                     = "Unknown error."
	notConnectedMessage                     = "You are not connected to ServiceNow.\n[Click here to link your ServiceNow account.](%s%s)"
	subscriptionsNotConfiguredError         = "It seems that subscriptions for ServiceNow have not been configured properly."
	subscriptionsNotConfiguredErrorForUser  = subscriptionsNotConfiguredError + " Please contact your system administrator to configure the subscriptions by following the instructions given by the plugin."
	subscriptionsNotConfiguredErrorForAdmin = subscriptionsNotConfiguredError + " To enable subscriptions, you have to download the update set provided by the plugin and upload that in ServiceNow. The update set is available in the plugin configuration settings. The instructions for uploading the update set are available in the plugin's documentation and also can be viewed by running the \"/servicenow help\" command."
	subscriptionsNotAuthorizedError         = "It seems that you are not authorized to manage subscriptions in ServiceNow."
	subscriptionsNotAuthorizedErrorForUser  = subscriptionsNotAuthorizedError + " Please contact your system administrator."
	subscriptionsNotAuthorizedErrorForAdmin = subscriptionsNotAuthorizedError + " Please follow the instructions for setting up user permissions available in the plugin's documentation. The instructions can also be viewed by running the \"/servicenow help\" command."
)

type CommandHandleFunc func(c *plugin.Context, args *model.CommandArgs, parameters []string, client Client) string

func (p *Plugin) getCommand() (*model.Command, error) {
	iconData, err := command.GetIconData(p.API, "assets/icon.svg")
	if err != nil {
		return nil, errors.Wrap(err, "failed to get icon data")
	}

	return &model.Command{
		Trigger:              constants.CommandTrigger,
		AutoComplete:         true,
		AutoCompleteDesc:     "Available commands: connect, disconnect, subscriptions, help",
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

	isSysAdmin, err := p.isAuthorizedSysAdmin(args.UserId)
	if err != nil {
		text := "Error checking user's permissions"
		p.API.LogWarn(text, "Error", err.Error())
		p.postCommandResponse(args, text)
		return &model.CommandResponse{}, nil
	}

	config := p.getConfiguration()
	if validationErr := config.IsValid(); validationErr != nil {
		text := "Please contact your system administrator to correctly configure the ServiceNow plugin."
		if isSysAdmin {
			text = fmt.Sprintf("Before using this plugin, you'll need to configure it in the System Console`: %s", validationErr.Error())
		}

		p.postCommandResponse(args, text)
		return &model.CommandResponse{}, nil
	}

	if action == "connect" {
		message := ""
		if _, userErr := p.GetUser(args.UserId); userErr == nil {
			message = "You are already connected to ServiceNow."
		} else {
			message = fmt.Sprintf("[Click here to link your ServiceNow account.](%s%s)", p.GetPluginURL(), constants.PathOAuth2Connect)
		}

		p.postCommandResponse(args, message)
		return &model.CommandResponse{}, nil
	}

	if action == "" || action == "help" {
		p.handleHelp(args, isSysAdmin)
		return &model.CommandResponse{}, nil
	}

	if f, ok := p.CommandHandlers[action]; ok {
		user := p.checkConnected(args)
		if user == nil {
			return &model.CommandResponse{}, nil
		}

		var client Client
		if action != "disconnect" {
			if client = p.GetClientFromUser(args, user); client == nil {
				return &model.CommandResponse{}, nil
			}

			if _, err := client.ActivateSubscriptions(); err != nil {
				message := ""
				switch {
				case strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotConfigured):
					message = subscriptionsNotConfiguredErrorForUser
					if isSysAdmin {
						message = subscriptionsNotConfiguredErrorForAdmin
					}
				case strings.EqualFold(err.Error(), constants.APIErrorIDSubscriptionsNotAuthorized):
					message = subscriptionsNotAuthorizedErrorForUser
					if isSysAdmin {
						message = subscriptionsNotAuthorizedErrorForAdmin
					}
				default:
					message = unknownErrorMessage
				}

				p.API.LogError("Unable to check or activate subscriptions in ServiceNow.", "Error", err.Error())
				p.postCommandResponse(args, message)
				return &model.CommandResponse{}, nil
			}
		}

		message := f(c, args, parameters, client)
		if message != "" {
			p.postCommandResponse(args, message)
		}
		return &model.CommandResponse{}, nil
	}

	p.postCommandResponse(args, fmt.Sprintf("Unknown action `%v`", action))
	return &model.CommandResponse{}, nil
}

func (p *Plugin) checkConnected(args *model.CommandArgs) *User {
	user, userErr := p.GetUser(args.UserId)
	if userErr != nil {
		if errors.Is(userErr, ErrNotFound) {
			p.postCommandResponse(args, fmt.Sprintf(notConnectedMessage, p.GetPluginURL(), constants.PathOAuth2Connect))
		} else {
			p.API.LogError("Unable to get user", "Error", userErr.Error())
			p.postCommandResponse(args, unknownErrorMessage)
		}
		return nil
	}

	return user
}

func (p *Plugin) GetClientFromUser(args *model.CommandArgs, user *User) Client {
	token, err := p.ParseAuthToken(user.OAuth2Token)
	if err != nil {
		p.API.LogError("Unable to parse oauth token", "Error", err.Error())
		p.postCommandResponse(args, unknownErrorMessage)
		return nil
	}

	return p.NewClient(context.Background(), token)
}

func (p *Plugin) handleHelp(args *model.CommandArgs, isSysAdmin bool) {
	p.postCommandResponse(args, p.getHelpMessage(helpCommandHeader, isSysAdmin))
}

func (p *Plugin) handleDisconnect(_ *plugin.Context, args *model.CommandArgs, _ []string, _ Client) string {
	if err := p.DisconnectUser(args.UserId); err != nil {
		p.API.LogError("Unable to disconnect user", "Error", err.Error())
		return disconnectErrorMessage
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventDisconnect,
		nil,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)
	return disconnectSuccessMessage
}

func (p *Plugin) handleSubscriptions(c *plugin.Context, args *model.CommandArgs, parameters []string, client Client) string {
	if len(parameters) == 0 {
		return "Invalid subscribe command. Available commands are 'list', 'add', 'edit' and 'delete'."
	}

	command := parameters[0]
	parameters = parameters[1:]

	switch {
	case command == "list":
		return p.handleListSubscriptions(c, args, parameters, client)
	case command == "add":
		return p.handleSubscribe(c, args, parameters, client)
	case command == "edit":
		return p.handleEditSubscription(c, args, parameters, client)
	case command == "delete":
		return p.handleDeleteSubscription(c, args, parameters, client)
	default:
		return fmt.Sprintf("Unknown subcommand %v", command)
	}
}

func (p *Plugin) handleSubscribe(_ *plugin.Context, args *model.CommandArgs, params []string, client Client) string {
	p.API.PublishWebSocketEvent(
		constants.WSEventOpenAddSubscriptionModal,
		nil,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func (p *Plugin) handleListSubscriptions(_ *plugin.Context, args *model.CommandArgs, _ []string, client Client) string {
	go func() {
		subscriptions, _, err := client.GetAllSubscriptions(args.ChannelId, args.UserId, fmt.Sprint(constants.DefaultPerPage), fmt.Sprint(constants.DefaultPage))
		if err != nil {
			p.API.LogError("Unable to get subscriptions", "Error", err.Error())
			p.postCommandResponse(args, listSubscriptionsErrorMessage)
			return
		}

		if len(subscriptions) == 0 {
			p.postCommandResponse(args, "You don't have any active subscriptions for this channel.")
			return
		}

		wg := sync.WaitGroup{}
		for _, subscription := range subscriptions {
			wg.Add(1)
			go p.GetRecordFromServiceNowForSubscription(subscription, client, &wg)
		}

		wg.Wait()
		p.postCommandResponse(args, ParseSubscriptionsToCommandResponse(subscriptions))
	}()

	return listSubscriptionsWaitMessage
}

func (p *Plugin) handleDeleteSubscription(_ *plugin.Context, args *model.CommandArgs, params []string, client Client) string {
	subscriptionID := params[0]
	valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, subscriptionID)
	if err != nil {
		p.API.LogError("Unable to validate the subscription ID", "Error", err.Error())
		return deleteSubscriptionErrorMessage
	}

	if !valid {
		return "Invalid subscription ID."
	}

	if _, err = client.DeleteSubscription(subscriptionID); err != nil {
		p.API.LogError("Unable to delete subscription", "Error", err.Error())
		return deleteSubscriptionErrorMessage
	}
	return deleteSubscriptionSuccessMessage
}

func (p *Plugin) handleEditSubscription(_ *plugin.Context, args *model.CommandArgs, params []string, client Client) string {
	if len(params) < 1 {
		return "Invalid number of params for this command."
	}
	subscriptionID := params[0]
	valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, subscriptionID)
	if err != nil {
		p.API.LogError("Unable to validate the subscription ID", "Error", err.Error())
		return editSubscriptionErrorMessage
	}

	if !valid {
		return "Invalid subscription ID."
	}

	subscription, _, err := client.GetSubscription(subscriptionID)
	if err != nil {
		p.API.LogError("Unable to get subscription", "Error", err.Error())
		return editSubscriptionErrorMessage
	}

	p.GetRecordFromServiceNowForSubscription(subscription, client, nil)

	subscriptionMap, err := ConvertSubscriptionToMap(subscription)
	if err != nil {
		p.API.LogError("Unable to convert subscription to map", "Error", err.Error())
		return editSubscriptionErrorMessage
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventOpenEditSubscriptionModal,
		subscriptionMap,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func getAutocompleteData() *model.AutocompleteData {
	serviceNow := model.NewAutocompleteData(constants.CommandTrigger, "[command]", "Available commands: connect, disconnect, help")

	connect := model.NewAutocompleteData("connect", "", "Connect your Mattermost account to your ServiceNow account")
	serviceNow.AddCommand(connect)

	disconnect := model.NewAutocompleteData("disconnect", "", "Disconnect your Mattermost account from your ServiceNow account")
	serviceNow.AddCommand(disconnect)

	subscriptions := model.NewAutocompleteData("subscriptions", "[command]", "Available commands: list, add, edit, delete")

	subscribeList := model.NewAutocompleteData("list", "", "List the current channel subscriptions")
	subscriptions.AddCommand(subscribeList)

	subscriptionsAdd := model.NewAutocompleteData("add", "[record_type] [record_id]", "Subscribe to the record changes in ServiceNow")
	subscriptionsAdd.AddTextArgument("Type of the record to subscribe to. Can be one of: problem, incident, change_request", "[record_type]", "")
	subscriptionsAdd.AddTextArgument("ID of the record to subscribe to. It is referred as sys_id in ServiceNow.", "[record_id]", "")
	subscriptions.AddCommand(subscriptionsAdd)

	subscriptionsEdit := model.NewAutocompleteData("edit", "[subscription_id] [subscription_type]", "Edit the subscriptions created to the record changes in ServiceNow")
	subscriptionsEdit.AddTextArgument("ID of the subscription", "[subscription_id]", "")
	subscriptionsEdit.AddTextArgument("Type of the subscription. Can be on of: priority, state", "[subscription_type]", "")
	subscriptions.AddCommand(subscriptionsEdit)

	subscriptionsDelete := model.NewAutocompleteData("delete", "[subscription_id]", "Unsubscribe to the record changes in ServiceNow")
	subscriptionsDelete.AddTextArgument("ID of the subscription", "[subscription_id]", "")
	subscriptions.AddCommand(subscriptionsDelete)

	serviceNow.AddCommand(subscriptions)

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
