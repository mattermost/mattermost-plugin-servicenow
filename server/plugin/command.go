package plugin

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"sync"
	"unicode"

	"github.com/mattermost/mattermost-plugin-api/experimental/command"
	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-servicenow/server/constants"
	"github.com/mattermost/mattermost-plugin-servicenow/server/serializer"
)

const (
	commandHelp = `##### Slash Commands
* |/servicenow connect| - Connect your Mattermost account to your ServiceNow account
* |/servicenow disconnect| - Disconnect your Mattermost account from your ServiceNow account
* |/servicenow subscriptions| - Manage your subscriptions to the record changes in ServiceNow
* |/servicenow share| - Search a record in ServiceNow and share it in a channel
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
	listSubscriptionsWaitMessage            = "Your subscriptions will be listed soon. Please wait."
	genericWaitMessage                      = "Your request is being processed. Please wait."
	deleteSubscriptionErrorMessage          = "Something went wrong. Not able to delete subscription. Check server logs for errors."
	deleteSubscriptionSuccessMessage        = "Subscription successfully deleted."
	genericErrorMessage                     = "Something went wrong."
	invalidSubscriptionIDMessage            = "Invalid subscription ID."
	notConnectedMessage                     = "You are not connected to ServiceNow.\n[Click here to link your ServiceNow account.](%s%s)"
	tokenExpiredReconnectMessage            = constants.APIErrorRefreshTokenExpired + "\n[Click here to link your ServiceNow account.](%s%s)"
	subscriptionsNotConfiguredError         = "It seems that subscriptions for ServiceNow have not been configured properly."
	subscriptionsNotConfiguredErrorForUser  = subscriptionsNotConfiguredError + " Please contact your system administrator to configure the subscriptions by following the instructions given by the plugin."
	subscriptionsNotConfiguredErrorForAdmin = subscriptionsNotConfiguredError + " To enable subscriptions, you have to download the update set provided by the plugin and upload that in ServiceNow. The update set is available in the plugin configuration settings. The instructions for uploading the update set are available in the plugin's documentation and also can be viewed by running the \"/servicenow help\" command."
	subscriptionsNotAuthorizedError         = "It seems that you are not authorized to manage subscriptions in ServiceNow."
	subscriptionsNotAuthorizedErrorForUser  = subscriptionsNotAuthorizedError + " Please contact your system administrator."
	subscriptionsNotAuthorizedErrorForAdmin = subscriptionsNotAuthorizedError + " Please follow the instructions for setting up user permissions available in the plugin's documentation. The instructions can also be viewed by running the \"/servicenow help\" command."
)

type CommandHandleFunc func(c *plugin.Context, args *model.CommandArgs, parameters []string, client Client, isSysAdmin bool) string

func (p *Plugin) getCommand() (*model.Command, error) {
	iconData, err := command.GetIconData(p.API, "assets/icon.svg")
	if err != nil {
		return nil, errors.Wrap(err, "failed to get icon data")
	}

	return &model.Command{
		Trigger:              constants.CommandTrigger,
		AutoComplete:         true,
		AutoCompleteDesc:     fmt.Sprintf("Available commands: %s, %s, %s, %s, %s", constants.CommandConnect, constants.CommandDisconnect, constants.CommandSubscriptions, constants.CommandSearchAndShare, constants.CommandHelp),
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

	isSysAdmin, err := p.IsAuthorizedSysAdmin(args.UserId)
	if err != nil {
		text := "Error checking user's permissions"
		p.API.LogWarn(text, "Error", err.Error())
		p.postCommandResponse(args, text)
		return &model.CommandResponse{}, nil
	}

	config := p.getConfiguration()
	if validationErr := config.IsValid(); validationErr != nil {
		text := constants.InvalidConfigUserMessage
		if isSysAdmin {
			text = fmt.Sprintf("%s: %s", constants.InvalidConfigAdminMessage, validationErr.Error())
		}

		p.postCommandResponse(args, text)
		return &model.CommandResponse{}, nil
	}

	if action == constants.CommandConnect {
		message := ""
		if _, userErr := p.GetUser(args.UserId); userErr == nil {
			message = constants.UserAlreadyConnectedMessage
		} else {
			message = fmt.Sprintf("[%s](%s%s)", constants.UserConnectMessage, p.GetPluginURL(), constants.PathOAuth2Connect)
		}

		p.postCommandResponse(args, message)
		return &model.CommandResponse{}, nil
	}

	if action == "" || action == constants.CommandHelp {
		p.handleHelp(args, isSysAdmin)
		return &model.CommandResponse{}, nil
	}

	if f, ok := p.CommandHandlers[action]; ok {
		user := p.checkConnected(args)
		if user == nil {
			return &model.CommandResponse{}, nil
		}

		var client Client
		if action == constants.CommandSubscriptions || action == constants.CommandUnsubscribe {
			if client = p.GetClientFromUser(args, user); client == nil {
				return &model.CommandResponse{}, nil
			}

			if _, err := client.ActivateSubscriptions(); err != nil {
				p.API.LogError("Unable to check or activate subscriptions in ServiceNow.", "Error", err.Error())
				p.postCommandResponse(args, p.handleClientError(nil, nil, err, isSysAdmin, 0, args.UserId, ""))
				return &model.CommandResponse{}, nil
			}
		}

		message := f(c, args, parameters, client, isSysAdmin)
		if message != "" {
			p.postCommandResponse(args, message)
		}
		return &model.CommandResponse{}, nil
	}

	p.postCommandResponse(args, fmt.Sprintf("Unknown action `%v`", action))
	return &model.CommandResponse{}, nil
}

func (p *Plugin) checkConnected(args *model.CommandArgs) *serializer.User {
	user, userErr := p.GetUser(args.UserId)
	if userErr != nil {
		if errors.Is(userErr, ErrNotFound) {
			p.postCommandResponse(args, fmt.Sprintf(notConnectedMessage, p.GetPluginURL(), constants.PathOAuth2Connect))
		} else {
			p.API.LogError("Unable to get user", "Error", userErr.Error())
			p.postCommandResponse(args, genericErrorMessage)
		}
		return nil
	}

	return user
}

func (p *Plugin) GetClientFromUser(args *model.CommandArgs, user *serializer.User) Client {
	token, err := p.ParseAuthToken(user.OAuth2Token)
	if err != nil {
		p.API.LogError("Unable to parse oauth token", "Error", err.Error())
		p.postCommandResponse(args, genericErrorMessage)
		return nil
	}

	return p.NewClient(context.Background(), token)
}

func (p *Plugin) handleHelp(args *model.CommandArgs, isSysAdmin bool) {
	p.postCommandResponse(args, p.getHelpMessage(helpCommandHeader, isSysAdmin))
}

func (p *Plugin) handleDisconnect(_ *plugin.Context, args *model.CommandArgs, _ []string, _ Client, _ bool) string {
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

func (p *Plugin) handleSubscriptions(c *plugin.Context, args *model.CommandArgs, parameters []string, client Client, isSysAdmin bool) string {
	if len(parameters) == 0 {
		return "Invalid subscribe command. Available commands are 'list', 'add', 'edit' and 'delete'."
	}

	command := parameters[0]
	parameters = parameters[1:]

	switch command {
	case constants.SubCommandList:
		return p.handleListSubscriptions(c, args, parameters, client, isSysAdmin)
	case constants.SubCommandAdd:
		return p.handleSubscribe(c, args, parameters, client, isSysAdmin)
	case constants.SubCommandEdit:
		return p.handleEditSubscription(c, args, parameters, client, isSysAdmin)
	case constants.SubCommandDelete:
		return p.handleDeleteSubscription(c, args, parameters, client, isSysAdmin)
	default:
		return fmt.Sprintf("Unknown subcommand %v", command)
	}
}

func (p *Plugin) handleIncident(_ *plugin.Context, args *model.CommandArgs, parameters []string, _ Client, _ bool) string {
	if len(parameters) == 0 {
		return "Invalid incident command. Available command is 'create'."
	}

	command := parameters[0]

	switch command {
	case constants.SubCommandCreate:
		return p.HandleCreateIncident(args)
	default:
		return fmt.Sprintf("Unknown subcommand %v", command)
	}
}

func (p *Plugin) HandleCreateIncident(args *model.CommandArgs) string {
	p.API.PublishWebSocketEvent(
		constants.WSEventOpenCreateIncidentModal,
		nil,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func (p *Plugin) handleSubscribe(_ *plugin.Context, args *model.CommandArgs, _ []string, _ Client, _ bool) string {
	p.API.PublishWebSocketEvent(
		constants.WSEventOpenAddSubscriptionModal,
		nil,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func (p *Plugin) handleSearchAndShare(_ *plugin.Context, args *model.CommandArgs, _ []string, _ Client, _ bool) string {
	p.API.PublishWebSocketEvent(
		constants.WSEventOpenSearchAndShareRecordsModal,
		nil,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func (p *Plugin) handleListSubscriptions(_ *plugin.Context, args *model.CommandArgs, params []string, client Client, isSysAdmin bool) string {
	userID := args.UserId
	channelID := args.ChannelId
	if len(params) >= 1 {
		if params[0] != constants.FilterCreatedByMe && params[0] != constants.FilterCreatedByAnyone {
			return fmt.Sprintf("Unknown filter %s", params[0])
		}

		if params[0] == constants.FilterCreatedByAnyone {
			userID = ""
		}
	}

	if len(params) == 2 {
		if params[1] != constants.FilterAllChannels {
			return fmt.Sprintf("Unknown filter %s", params[1])
		}
		channelID = ""
	}

	var subscriptionList []*serializer.SubscriptionResponse
	go func() {
		subscriptions, _, err := client.GetAllSubscriptions(channelID, userID, "", fmt.Sprint(constants.DefaultPerPage), fmt.Sprint(constants.DefaultPage))
		if err != nil {
			p.API.LogError("Unable to get subscriptions", "Error", err.Error())
			p.postCommandResponse(args, p.handleClientError(nil, nil, err, isSysAdmin, 0, userID, ""))
			return
		}

		if len(subscriptions) == 0 {
			p.postCommandResponse(args, constants.ErrorNoActiveSubscriptions)
			return
		}

		for _, subscription := range subscriptions {
			_, permissionErr := p.HasPublicOrPrivateChannelPermissions(args.UserId, subscription.ChannelID)
			if permissionErr == nil {
				subscriptionList = append(subscriptionList, subscription)
			}
		}

		if len(subscriptionList) == 0 {
			p.postCommandResponse(args, constants.ErrorNoActiveSubscriptions)
			return
		}

		wg := sync.WaitGroup{}
		for _, subscription := range subscriptionList {
			wg.Add(1)
			go func(subscription *serializer.SubscriptionResponse) {
				defer wg.Done()
				user, err := p.API.GetUser(subscription.UserID)
				if err != nil {
					p.API.LogError("Error in getting user", "UserID", subscription.UserID)
					subscription.UserName = "N/A"
				} else {
					subscription.UserName = user.Username
				}

				channel, err := p.API.GetChannel(subscription.ChannelID)
				if err != nil {
					p.API.LogError("Error in getting channel", "ChannelID", subscription.ChannelID)
					subscription.ChannelName = "N/A"
				} else {
					subscription.ChannelName = channel.DisplayName
				}
			}(subscription)

			if subscription.Type == constants.SubscriptionTypeBulk {
				continue
			}
			wg.Add(1)
			go p.GetRecordFromServiceNowForSubscription(subscription, client, &wg)
		}

		wg.Wait()
		p.postCommandResponse(args, ParseSubscriptionsToCommandResponse(subscriptionList))
	}()

	return listSubscriptionsWaitMessage
}

func (p *Plugin) handleDeleteSubscription(_ *plugin.Context, args *model.CommandArgs, params []string, client Client, isSysAdmin bool) string {
	if len(params) < 1 {
		return constants.ErrorCommandInvalidNumberOfParams
	}

	go func() {
		subscriptionID := params[0]
		valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, subscriptionID)
		if err != nil {
			p.API.LogError("Unable to validate the subscription ID", "Error", err.Error())
			p.postCommandResponse(args, deleteSubscriptionErrorMessage)
			return
		}

		if !valid {
			p.postCommandResponse(args, invalidSubscriptionIDMessage)
			return
		}

		if statusCode, err := client.DeleteSubscription(subscriptionID); err != nil {
			p.API.LogError("Unable to delete subscription", "Error", err.Error())
			if statusCode == http.StatusNotFound {
				p.postCommandResponse(args, fmt.Sprintf("Subscription with ID %s doesn't exist.", subscriptionID))
			} else {
				p.postCommandResponse(args, p.handleClientError(nil, nil, err, isSysAdmin, 0, args.UserId, ""))
			}
			return
		}

		p.API.PublishWebSocketEvent(
			constants.WSEventSubscriptionDeleted,
			nil,
			&model.WebsocketBroadcast{UserId: args.UserId},
		)

		p.postCommandResponse(args, deleteSubscriptionSuccessMessage)
	}()

	return genericWaitMessage
}

func (p *Plugin) handleEditSubscription(_ *plugin.Context, args *model.CommandArgs, params []string, client Client, isSysAdmin bool) string {
	if len(params) < 1 {
		return constants.ErrorCommandInvalidNumberOfParams
	}
	subscriptionID := params[0]
	valid, err := regexp.MatchString(constants.ServiceNowSysIDRegex, subscriptionID)
	if err != nil {
		p.API.LogError("Unable to validate the subscription ID", "Error", err.Error())
		return genericErrorMessage
	}

	if !valid {
		return invalidSubscriptionIDMessage
	}

	subscription, _, err := client.GetSubscription(subscriptionID)
	if err != nil {
		p.API.LogError("Unable to get subscription", "Error", err.Error())
		return p.handleClientError(nil, nil, err, isSysAdmin, 0, args.UserId, "")
	}

	if subscription.Type == constants.SubscriptionTypeRecord {
		p.GetRecordFromServiceNowForSubscription(subscription, client, nil)
	}

	subscriptionMap, err := ConvertSubscriptionToMap(subscription)
	if err != nil {
		p.API.LogError("Unable to convert subscription to map", "Error", err.Error())
		return genericErrorMessage
	}

	p.API.PublishWebSocketEvent(
		constants.WSEventOpenEditSubscriptionModal,
		subscriptionMap,
		&model.WebsocketBroadcast{UserId: args.UserId},
	)

	return ""
}

func getAutocompleteData() *model.AutocompleteData {
	serviceNow := model.NewAutocompleteData(constants.CommandTrigger, "[command]", fmt.Sprintf("Available commands: %s, %s, %s, %s, %s, %s", constants.CommandConnect, constants.CommandDisconnect, constants.CommandSubscriptions, constants.CommandSearchAndShare, constants.CommandIncident, constants.CommandHelp))

	connect := model.NewAutocompleteData(constants.CommandConnect, "", "Connect your Mattermost account to your ServiceNow account")
	serviceNow.AddCommand(connect)

	disconnect := model.NewAutocompleteData(constants.CommandDisconnect, "", "Disconnect your Mattermost account from your ServiceNow account")
	serviceNow.AddCommand(disconnect)

	subscriptions := model.NewAutocompleteData(constants.CommandSubscriptions, "[command]", fmt.Sprintf("Available commands: %s, %s, %s, %s", constants.SubCommandList, constants.SubCommandAdd, constants.SubCommandEdit, constants.SubCommandDelete))

	subscribeList := model.NewAutocompleteData("list", "", "List the current channel subscriptions")
	subscriptionCreatedByMe := model.NewAutocompleteData("me", "", "Created By Me")
	subscriptionShowForAllChannels := model.NewAutocompleteData("all_channels", "", "Show for all channels or You can leave this argument to show for the current channel only")
	subscriptionCreatedByMe.AddCommand(subscriptionShowForAllChannels)
	subscribeList.AddCommand(subscriptionCreatedByMe)
	subscriptionCreatedByAnyone := model.NewAutocompleteData("anyone", "", "Created By Anyone")
	subscriptionCreatedByAnyone.AddCommand(subscriptionShowForAllChannels)
	subscribeList.AddCommand(subscriptionCreatedByAnyone)
	subscriptions.AddCommand(subscribeList)

	subscriptionsAdd := model.NewAutocompleteData(constants.SubCommandAdd, "", "Subscribe to the record changes in ServiceNow")
	subscriptions.AddCommand(subscriptionsAdd)

	subscriptionsEdit := model.NewAutocompleteData(constants.SubCommandEdit, "[subscription_id]", "Edit the subscriptions created to the record changes in ServiceNow")
	subscriptionsEdit.AddTextArgument("ID of the subscription", "[subscription_id]", "")
	subscriptions.AddCommand(subscriptionsEdit)

	subscriptionsDelete := model.NewAutocompleteData(constants.SubCommandDelete, "[subscription_id]", "Unsubscribe to the record changes in ServiceNow")
	subscriptionsDelete.AddTextArgument("ID of the subscription", "[subscription_id]", "")
	subscriptions.AddCommand(subscriptionsDelete)

	serviceNow.AddCommand(subscriptions)

	searchRecords := model.NewAutocompleteData(constants.CommandSearchAndShare, "", "Search and share a ServiceNow record")
	serviceNow.AddCommand(searchRecords)

	incident := model.NewAutocompleteData(constants.CommandIncident, "[command]", fmt.Sprintf("Available command: %s", constants.SubCommandCreate))
	incidentCreate := model.NewAutocompleteData(constants.SubCommandCreate, "", "Create an incident")
	incident.AddCommand(incidentCreate)
	serviceNow.AddCommand(incident)

	help := model.NewAutocompleteData(constants.CommandHelp, "", "Display slash command help text")
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
