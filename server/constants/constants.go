package constants

// Bot related constants
const (
	BotUserName            = "servicenow"
	BotDisplayName         = "ServiceNow"
	BotDescription         = "A bot account created by the ServiceNow plugin."
	HeaderMattermostUserID = "Mattermost-User-ID"

	ConnectSuccessMessage = "#### Welcome to the Mattermost ServiceNow Plugin!\n" +
		"You've connected your Mattermost account `%s` to ServiceNow. Read about the features of this plugin below:\n\n" +
		"##### Slash Commands\n"

	PathOAuth2Connect  = "/oauth2/connect"
	PathOAuth2Complete = "/oauth2/complete"
	CommandTrigger     = "servicenow"
)
