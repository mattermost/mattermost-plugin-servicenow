package constants

import "errors"

const (
	// Bot related constants
	BotUserName    = "servicenow"
	BotDisplayName = "ServiceNow"
	BotDescription = "A bot account created by the ServiceNow plugin."

	HeaderMattermostUserID = "Mattermost-User-ID"
	CommandTrigger         = "servicenow"

	ConnectSuccessMessage = "#### Welcome to the Mattermost ServiceNow Plugin!\n" +
		"You've connected your Mattermost account `%s` to ServiceNow. Read about the features of this plugin below:\n\n" +
		"##### Slash Commands\n"

	ServiceNowForMattermostNotificationsAppID = "x_830655_mm_std"
	ServiceNowSysIDRegex                      = "[0-9a-f]{32}"
	SysQueryParam                             = "sysparm_query"
	SysQueryParamLimit                        = "sysparm_limit"
	SysQueryParamOffset                       = "sysparm_offset"
	DefaultPage                               = 0
	DefaultPerPage                            = 10
	MaxPerPage                                = 50

	UpdateSetNotUploadedMessage = "it looks like the notifications have not been configured in ServiceNow by uploading and committing the update set."
	UpdateSetVersion            = "v1.0"
	UpdateSetFilename           = "servicenow_for_mattermost_notifications_" + UpdateSetVersion + ".xml"

	SubscriptionLevelRecord             = "record"
	SubscriptionRecordTypeProblem       = "problem"
	SubscriptionRecordTypeIncident      = "incident"
	SubscriptionRecordTypeChangeRequest = "change_request"
	SubscriptionTypePriority            = "priority"
	SubscriptionTypeState               = "state"

	// Used for storing the token in the request context to pass from one middleware to another
	ContextTokenKey ServiceNowOAuthToken = "ServiceNow-Oauth-Token"

	QueryParamPage      = "page"
	QueryParamPerPage   = "per_page"
	QueryParamChannelID = "channel_id"
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

	ErrUpdateSetNotUploaded error = errors.New("update set not uploaded")
)

type ServiceNowOAuthToken string
