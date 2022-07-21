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

	CommandTrigger                            = "servicenow"
	ServiceNowForMattermostNotificationsAppID = "x_830655_mm_std_servicenow_for_mattermost"
	SysQueryParam                             = "sysparm_query"

	UpdateSetVersion  = "v1.0"
	UpdateSetFilename = "servicenow_for_mattermost_notifications_" + UpdateSetVersion + ".xml"
)
