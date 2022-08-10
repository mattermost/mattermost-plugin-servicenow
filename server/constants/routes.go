package constants

const (
	PathOAuth2Connect       = "/oauth2/connect"
	PathOAuth2Complete      = "/oauth2/complete"
	PathDownloadUpdateSet   = "/download"
	PathCreateSubscription  = "/subscriptions"
	PathGetAllSubscriptions = PathCreateSubscription
	PathDeleteSubscription  = PathCreateSubscription + "/{subscription_id:" + ServiceNowSysIDRegex + "}"
	PathEditSubscription    = PathDeleteSubscription

	// ServiceNow API paths
	PathActivateSubscriptions = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_notifications_auth"
	PathSubscriptionCRUD      = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_subscriptions"
)
