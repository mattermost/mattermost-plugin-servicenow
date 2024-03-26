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
	UserAlreadyConnectedMessage = "You are already connected to ServiceNow."
	UserConnectMessage          = "Click here to link your ServiceNow account."
	InvalidConfigUserMessage    = "Please contact your system administrator to correctly configure the ServiceNow plugin."
	InvalidConfigAdminMessage   = "Before using this plugin, you'll need to configure it in the System Console`"

	ServiceNowForMattermostNotificationsAppID = "x_830655_mm_std"
	ServiceNowSysIDRegex                      = "[0-9a-f]{32}"
	SysQueryParam                             = "sysparm_query"
	SysQueryParamLimit                        = "sysparm_limit"
	SysQueryParamOffset                       = "sysparm_offset"
	SysQueryParamFields                       = "sysparm_fields"
	SysQueryParamDisplayValue                 = "sysparm_display_value"
	SysQueryParamText                         = "sysparm_text"

	UpdateSetNotUploadedMessage = "it looks like the notifications have not been configured in ServiceNow by uploading and committing the update set."

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
	BulkSubscription                 = "Bulk"

	// Filters
	FilterCreatedByMe     = "me"
	FilterCreatedByAnyone = "anyone"
	FilterAllChannels     = "all_channels"

	// Used for storing the token in the request context to pass from one middleware to another
	// #nosec G101 -- This is a false positive. The below line is not a hardcoded credential
	ContextTokenKey ServiceNowOAuthToken = "ServiceNow-Oauth-Token"

	DefaultPage                                = 0
	DefaultPerPage                             = 20
	MaxPerPage                                 = 100
	CharacterThresholdForSearchingRecords      = 3
	CharacterThresholdForSearchingCatalogItems = 4
	QueryParamPage                             = "page"
	QueryParamPerPage                          = "per_page"
	QueryParamChannelID                        = "channel_id"
	QueryParamUserID                           = "user_id"
	QueryParamSubscriptionType                 = "subscription_type"
	QueryParamSearchTerm                       = "search"
	PathParamSubscriptionID                    = "subscription_id"
	PathParamTeamID                            = "team_id"
	PathParamRecordType                        = "record_type"
	PathParamRecordID                          = "record_id"

	// ServiceNow table fields
	FieldSysID                = "sys_id"
	FieldSysUpdatedOn         = "sys_updated_on"
	FieldNumber               = "number"
	FieldShortDescription     = "short_description"
	FieldCommentsAndWorkNotes = "comments_and_work_notes"
	FieldAssignedTo           = "assigned_to"
	FieldAssignmentGroup      = "assignment_group"
	FieldKnowledgeBase        = "knowledge_base"
	FieldCategory             = "category"

	// Websocket events
	WSEventConnect                        = "connect"
	WSEventDisconnect                     = "disconnect"
	WSEventOpenAddSubscriptionModal       = "add_subscription"
	WSEventOpenEditSubscriptionModal      = "edit_subscription"
	WSEventSubscriptionDeleted            = "subscription_deleted"
	WSEventOpenSearchAndShareRecordsModal = "search_and_share_record"
	WSEventOpenCommentModal               = "comment_modal"
	WSEventOpenUpdateStateModal           = "update_state"
	WSEventOpenCreateIncidentModal        = "create_incident"

	// API Errors
	APIErrorIDNotConnected               = "not_connected"
	APIErrorNotConnected                 = "You have not connected your Mattermost account to ServiceNow."
	APIErrorIDSubscriptionsNotConfigured = "subscriptions_not_configured"
	APIErrorSubscriptionsNotConfigured   = "Subscripitons are not configured for this server."
	APIErrorIDSubscriptionsNotAuthorized = "subscriptions_not_authorized"
	APIErrorSubscriptionsNotAuthorized   = "You are not authorized to manage subscriptions in ServiceNow."
	APIErrorIDLatestUpdateSetNotUploaded = "update_set_not_uploaded"
	APIErrorLatestUpdateSetNotUploaded   = "The latest update set has not been uploaded to ServiceNow."
	APIErrorIDInsufficientPermissions    = "insufficient_permissions"
	APIErrorInsufficientPermissions      = "Insufficient Permissions"
	APIErrorIDRefreshTokenExpired        = "refresh_token_expired"
	APIErrorRefreshTokenExpired          = "Your connection with ServiceNow has expired. Please reconnect your account."
	APIErrorCreateIncident               = "Error in creating the incident"
	APIErrorSearchingCatalogItems        = "Error in searching for catalog items in ServiceNow"

	// Slack attachment context constants
	ContextNameRecordType = "record_type"
	ContextNameRecordID   = "record_id"

	// Slash commands
	CommandHelp           = "help"
	CommandConnect        = "connect"
	CommandDisconnect     = "disconnect"
	CommandSubscriptions  = "subscriptions"
	CommandUnsubscribe    = "unsubscribe"
	CommandSearchAndShare = "share"
	SubCommandList        = "list"
	SubCommandAdd         = "add"
	SubCommandEdit        = "edit"
	SubCommandDelete      = "delete"
	CommandIncident       = "incident"
	SubCommandCreate      = "create"
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
	ErrorInvalidSecret                    = "Invalid secret"
	ErrorInvalidQueryParam                = "Invalid query param"
	ErrorNotAuthorized                    = "Not authorized"
	ErrorUserAlreadyConnected             = "user is already connected to ServiceNow"
	ErrorMissingUserCodeState             = "missing user, code or state"
	ErrorUserIDMismatchInOAuth            = "not authorized, user ID mismatch"
	ErrorEmptyComment                     = "comment should not be empty"
	ErrorGeneric                          = "Something went wrong."
	ErrorGetUsers                         = "Failed to get the users."
	ErrorEmptyShortDescription            = "short description should not be empty"
	ErrorGetBotChannel                    = "Couldn't get the bot's DM channel"
	ErrorSearchTermThreshold              = "The search term must be at least %d characters long."
	ErrorGetUser                          = "Unable to get the user"
	ErrorCreatePost                       = "Unable to create post"
	ErrorGetChannel                       = "Error in getting channels for team and user"
	ErrorGetBundlePath                    = "Error in getting the bundle path"
	ErrorReadingFile                      = "Error in reading the file"
	ErrorUnmarshallingRequestBody         = "Error in unmarshalling the request body"
	ErrorValidatingRequestBody            = "Error in validating the request body"
	ErrorGetSubscriptions                 = "Error in getting all subscriptions"
	ErrorEditingSubscription              = "Error in editing the subscription"
	ErrorDeleteSubscription               = "Error in deleting the subscription"
	ErrorGetComments                      = "Error in getting all comments"
	ErrorCreateComment                    = "Error in creating the comment"
	ErrorSearchingRecord                  = "Error in searching for records in ServiceNow"
	ErrorGetRecord                        = "Error in getting record from ServiceNow"
	ErrorGetStates                        = "Error in getting the states"
	ErrorUpdateState                      = "Error in updating the state"
	ErrorACLRestrictsRecordRetrieval      = "ACL restricts the record retrieval"
	ErrorHandlingNestedFields             = "Error in handling the nested fields"
	ErrorCommandInvalidNumberOfParams     = "Some field(s) are missing to run the command. Please run `/servicenow help` for more information."
	ErrorUserMismatch                     = "User ID does not match with the currently logged-in user ID."
	ErrorInsufficientPermissions          = "user has insufficient permissions for the current channel"
	ErrorChannelPermissionsForUser        = "unable to get the channel permissions for a user"
	ErrorNoActiveSubscriptions            = "You don't have any active subscriptions."
	ErrorInvalidChannelType               = "invalid channel type for performing action"
)

// kv store keys prefix
const (
	UserKeyPrefix   = "user_"
	OAuth2KeyPrefix = "oauth2_"
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
		RecordTypeIncident:     true,
		RecordTypeTask:         true,
		RecordTypeChangeTask:   true,
		RecordTypeFollowOnTask: true,
	}
)

type ServiceNowOAuthToken string
