package constants

const (
	PathOAuth2Connect          = "/oauth2/connect"
	PathOAuth2Complete         = "/oauth2/complete"
	PathDownloadUpdateSet      = "/download"
	PathCreateSubscription     = "/subscriptions"
	PathGetAllSubscriptions    = PathCreateSubscription
	PathDeleteSubscription     = PathCreateSubscription + "/{subscription_id:" + ServiceNowSysIDRegex + "}"
	PathEditSubscription       = PathDeleteSubscription
	PathGetUserChannelsForTeam = "/channels/{team_id:[A-Za-z0-9]+}"
	PathSearchRecords          = "/records/{record_type}"
	PathGetSingleRecord        = "/records/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathProcessNotification    = "/notification"

	// ServiceNow API paths
	PathActivateSubscriptions     = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_notifications_auth"
	PathSubscriptionCRUD          = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_subscriptions"
	PathSearchRecordsInServiceNow = "api/now/table/{tableName}"
)
