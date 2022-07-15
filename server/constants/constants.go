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

	UpdateSetNotUploadedMessage = "It looks like the notifications have not been configured in ServiceNow by uploading and committing the update set."

	CommandTrigger                            = "servicenow"
	ServiceNowForMattermostNotificationsAppID = "x_830655_mm_std"
	SysQueryParam                             = "sysparm_query"
	SysQueryParamLimit                        = "sysparm_limit"
	SysQueryParamOffset                       = "sysparm_offset"
	DefaultPage                               = 0
	DefaultPerPage                            = 10

	UpdateSetVersion                    = "v1.0"
	UpdateSetFilename                   = "servicenow_for_mattermost_notifications_" + UpdateSetVersion + ".xml"
	SubscriptionLevelRecord             = "record"
	SubscriptionRecordTypeProblem       = "problem"
	SubscriptionRecordTypeIncident      = "incident"
	SubscriptionRecordTypeChangeRequest = "change_request"
	SubscriptionTypePriority            = "priority"
	SubscriptionTypeState               = "state"

	ServiceNowSysIDRegex = "[0-9a-f]{32}"
)

var (
	SubscriptionRecordTypes = map[string]bool{
		SubscriptionRecordTypeIncident:      true,
		SubscriptionRecordTypeProblem:       true,
		SubscriptionRecordTypeChangeRequest: true,
	}

	SubscriptionTypes = map[string]bool{
		SubscriptionTypePriority: true,
		SubscriptionTypeState:    true,
	}
)
