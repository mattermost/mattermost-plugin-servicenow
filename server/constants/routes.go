package constants

const (
	PathPrefix                       = "/api/v1"
	PathOAuth2Connect                = "/oauth2/connect"
	PathOAuth2Complete               = "/oauth2/complete"
	PathCreateSubscription           = "/subscriptions"
	PathGetAllSubscriptions          = PathCreateSubscription
	PathSubscriptionOperationsByID   = PathCreateSubscription + "/{subscription_id:" + ServiceNowSysIDRegex + "}"
	PathGetUserChannelsForTeam       = "/channels/{team_id:[A-Za-z0-9]+}"
	PathSearchRecords                = "/records/{record_type}"
	PathGetSingleRecord              = "/records/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathProcessNotification          = "/notification"
	PathGetConnected                 = "/connected"
	PathGetConfig                    = "/config"
	PathShareRecord                  = "/share/{channel_id:[A-Za-z0-9]+}"
	PathCommentsForRecord            = "/comments/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathGetStatesForRecordType       = "/states/{record_type}"
	PathUpdateStateOfRecord          = "/states/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathSearchCatalogItems           = "/catalog"
	PathGetUsers                     = "/users"
	PathCreateIncident               = "/incident"
	PathGetIncidentFields            = "/incident-fields"
	PathCheckSubscriptionsConfigured = "/subscriptions-configured"
	PathSearchFilterValues           = "/filter/{filter_type}"

	// ServiceNow API paths
	PathActivateSubscriptions             = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_notifications_auth"
	PathSubscriptionCRUD                  = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_subscriptions"
	PathGetRecordsFromServiceNow          = "api/now/table/{tableName}"
	PathGetStatesFromServiceNow           = "api/" + ServiceNowForMattermostNotificationsAppID + "/getstates/{record_type}"
	PathGetCatalogItemsFromServiceNow     = "api/sn_sc/servicecatalog/items"
	PathGetUserFromServiceNow             = "/api/now/table/sys_user"
	PathGetIncidentFieldsFromServiceNow   = "api/" + ServiceNowForMattermostNotificationsAppID + "/getincidentfields"
	PathGetAssignmentGroupsFromServiceNow = "api/now/table/sys_user_group"
	PathGetServicesFromServiceNow         = "api/now/table/cmdb_ci_service"

	// ServiceNow URLs
	PathServiceNowURL = "/now/nav/ui/classic/params/target"
	PathSysUser       = "/sys_user.do?sys_id=%s"
	PathSysUserGroup  = "/sys_user_group.do?sys_id=%s"
	PathKnowledgeBase = PathServiceNowURL + "/kb_knowledge_base.do%%3Fsys_id=%s"
	PathCategory      = PathServiceNowURL + "/kb_category.do%%3Fsys_id=%s"
)
