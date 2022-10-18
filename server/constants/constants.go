package constants

const (
	// Bot related constants
	BotUserName    = "servicenow"
	BotDisplayName = "ServiceNow"
	BotDescription = "A bot account created by the ServiceNow plugin."

	HeaderMattermostUserID = "Mattermost-User-Id"
	CommandTrigger         = "servicenow"

	ConnectSuccessMessage = "#### Welcome to the Mattermost ServiceNow Plugin\n" +
		"You've successfully connected your Mattermost account `%s` to ServiceNow. Read about the features of this plugin below:\n\n"

	ServiceNowForMattermostNotificationsAppID = "x_830655_mm_std"
	ServiceNowSysIDRegex                      = "[0-9a-f]{32}"
	SysQueryParam                             = "sysparm_query"
	SysQueryParamLimit                        = "sysparm_limit"
	SysQueryParamOffset                       = "sysparm_offset"
	SysQueryParamFields                       = "sysparm_fields"
	SysQueryParamDisplayValue                 = "sysparm_display_value"

	UpdateSetNotUploadedMessage = "it looks like the notifications have not been configured in ServiceNow by uploading and committing the update set."
	UpdateSetVersion            = "v1.0"
	UpdateSetFilename           = "servicenow_for_mattermost_notifications_" + UpdateSetVersion + ".xml"

	SubscriptionTypeRecord           = "record"
	SubscriptionTypeBulk             = "object"
	RecordTypeProblem                = "problem"
	RecordTypeIncident               = "incident"
	RecordTypeChangeRequest          = "change_request"
	RecordTypeKnowledge              = "kb_knowledge"
	RecordTypeTask                   = "task"
	RecordTypeChangeTask             = "change_task"
	RecordTypeFollowOnTask           = "cert_follow_on_task"
	SubscriptionEventPriority        = "priority"
	SubscriptionEventState           = "state"
	SubscriptionEventCommented       = "commented"
	SubscriptionEventAssignedTo      = "assigned_to"
	SubscriptionEventAssignmentGroup = "assignment_group"
	SubscriptionEventCreated         = "created"

	// Filters
	FilterCreatedByMe     = "me"
	FilterCreatedByAnyone = "anyone"
	FilterAllChannels     = "all_channels"

	// Used for storing the token in the request context to pass from one middleware to another
	// #nosec G101 -- This is a false positive. The below line is not a hardcoded credential
	ContextTokenKey ServiceNowOAuthToken = "ServiceNow-Oauth-Token"

	DefaultPage                           = 0
	DefaultPerPage                        = 20
	MaxPerPage                            = 100
	CharacterThresholdForSearchingRecords = 3
	QueryParamPage                        = "page"
	QueryParamPerPage                     = "per_page"
	QueryParamChannelID                   = "channel_id"
	QueryParamUserID                      = "user_id"
	QueryParamSubscriptionType            = "subscription_type"
	QueryParamSearchTerm                  = "search"
	PathParamSubscriptionID               = "subscription_id"
	PathParamTeamID                       = "team_id"
	PathParamRecordType                   = "record_type"
	PathParamRecordID                     = "record_id"

	// ServiceNow table fields
	FieldSysID                = "sys_id"
	FieldSysUpdatedOn         = "sys_updated_on"
	FieldNumber               = "number"
	FieldShortDescription     = "short_description"
	FieldCommentsAndWorkNotes = "comments_and_work_notes"

	// Websocket events
	WSEventConnect                   = "connect"
	WSEventDisconnect                = "disconnect"
	WSEventOpenAddSubscriptionModal  = "add_subscription"
	WSEventOpenEditSubscriptionModal = "edit_subscription"
	WSEventSubscriptionDeleted       = "subscription_deleted"

	// API Errors
	APIErrorIDNotConnected               = "not_connected"
	APIErrorNotConnected                 = "You have not connected your Mattermost account to ServiceNow."
	APIErrorIDSubscriptionsNotConfigured = "subscriptions_not_configured"
	APIErrorSubscriptionsNotConfigured   = "Subscripitons are not configured for this server."
	APIErrorIDSubscriptionsNotAuthorized = "subscriptions_not_authorized"
	APIErrorSubscriptionsNotAuthorized   = "You are not authorized to manage subscriptions in ServiceNow."
)

// #nosec G101 -- This is a false positive. The below line is not a hardcoded credential
const (
	ErrorEmptyServiceNowURL               = "serviceNow server URL should not be empty"
	ErrorEmptyServiceNowOAuthClientID     = "serviceNow OAuth clientID should not be empty"
	ErrorEmptyServiceNowOAuthClientSecret = "serviceNow OAuth clientSecret should not be empty"
	ErrorEmptyEncryptionSecret            = "encryption secret should not be empty"
	ErrorEmptyWebhookSecret               = "webhook secret should not be empty"
	ErrorInvalidRecordType                = "Invalid record type"
	ErrorInvalidTeamID                    = "Invalid team ID"
	ErrorInvalidChannelID                 = "Invalid channel ID"
	ErrorNotAuthorized                    = "Not authorized"
	ErrorUserAlreadyConnected             = "user is already connected to ServiceNow"
	ErrorMissingUserCodeState             = "missing user, code or state"
	ErrorUserIDMismatchInOAuth            = "not authorized, user ID mismatch"
	ErrorEmptyComment                     = "comment should not be empty"
	ErrorGeneric                          = "Something went wrong."
)

var (
	ValidSubscriptionTypes = map[string]bool{
		SubscriptionTypeRecord: true,
		SubscriptionTypeBulk:   true,
	}

	ValidSubscriptionRecordTypes = map[string]bool{
		RecordTypeIncident:      true,
		RecordTypeProblem:       true,
		RecordTypeChangeRequest: true,
	}

	ValidRecordTypesForSearching = map[string]bool{
		RecordTypeIncident:      true,
		RecordTypeProblem:       true,
		RecordTypeChangeRequest: true,
		RecordTypeKnowledge:     true,
		RecordTypeTask:          true,
		RecordTypeChangeTask:    true,
		RecordTypeFollowOnTask:  true,
	}

	ValidSubscriptionEvents = map[string]bool{
		SubscriptionEventCreated:         true,
		SubscriptionEventPriority:        true,
		SubscriptionEventState:           true,
		SubscriptionEventCommented:       true,
		SubscriptionEventAssignedTo:      true,
		SubscriptionEventAssignmentGroup: true,
	}

	FormattedEventNames = map[string]string{
		SubscriptionEventCreated:         "New record created",
		SubscriptionEventPriority:        "Priority changed",
		SubscriptionEventState:           "State changed",
		SubscriptionEventCommented:       "New comment",
		SubscriptionEventAssignedTo:      "Assigned to changed",
		SubscriptionEventAssignmentGroup: "Assignment group changed",
	}

	FormattedRecordTypes = map[string]string{
		RecordTypeProblem:       "Problem",
		RecordTypeIncident:      "Incident",
		RecordTypeChangeRequest: "Change Request",
	}

	RecordTypesSupportingComments = map[string]bool{
		RecordTypeIncident:      true,
		RecordTypeProblem:       true,
		RecordTypeChangeRequest: true,
		RecordTypeTask:          true,
		RecordTypeChangeTask:    true,
		RecordTypeFollowOnTask:  true,
	}

	RecordTypesSupportingStateUpdation = map[string]bool{
		RecordTypeIncident: true,
	}
)

type ServiceNowOAuthToken string
