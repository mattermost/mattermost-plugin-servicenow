package constants

const (
	PathPrefix                 = "/api/v1"
	PathOAuth2Connect          = "/oauth2/connect"
	PathOAuth2Complete         = "/oauth2/complete"
	PathCreateSubscription     = "/subscriptions"
	PathGetAllSubscriptions    = PathCreateSubscription
	PathDeleteSubscription     = PathCreateSubscription + "/{subscription_id:" + ServiceNowSysIDRegex + "}"
	PathEditSubscription       = PathDeleteSubscription
	PathGetUserChannelsForTeam = "/channels/{team_id:[A-Za-z0-9]+}"
	PathSearchRecords          = "/records/{record_type}"
	PathGetSingleRecord        = "/records/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathProcessNotification    = "/notification"
	PathGetConnected           = "/connected"
	PathGetConfig              = "/config"
	PathShareRecord            = "/share/{channel_id:[A-Za-z0-9]+}"
	PathCommentsForRecord      = "/comments/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathOpenCommentModal       = "/comment-modal"
	PathGetStatesForRecordType = "/states/{record_type}"
	PathUpdateStateOfRecord    = "/states/{record_type}/{record_id:" + ServiceNowSysIDRegex + "}"
	PathOpenStateModal         = "/state-modal"
	PathSearchCatalogItems     = "/catalog"
	PathGetUsers               = "/users"
	PathCreateIncident         = "/incident"

	// ServiceNow API paths
	PathActivateSubscriptions         = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_notifications_auth"
	PathSubscriptionCRUD              = "api/now/table/" + ServiceNowForMattermostNotificationsAppID + "_servicenow_for_mattermost_subscriptions"
	PathGetRecordsFromServiceNow      = "api/now/table/{tableName}"
	PathGetStatesFromServiceNow       = "api/" + ServiceNowForMattermostNotificationsAppID + "/getstates/{record_type}"
	PathGetCatalogItemsFromServiceNow = "api/sn_sc/servicecatalog/items"
	PathGetUserFromServiceNow         = "/api/now/table/sys_user"

	// ServiceNow URLs
	PathServiceNowURL = "/now/nav/ui/classic/params/target"
	PathSysUser       = "/sys_user.do?sys_id=%s"
	PathSysUserGroup  = "/sys_user_group.do?sys_id=%s"
	PathKnowledgeBase = PathServiceNowURL + "/kb_knowledge_base.do%%3Fsys_id=%s"
	PathCategory      = PathServiceNowURL + "/kb_category.do%%3Fsys_id=%s"
	PathRecordList    = "%s/nav_to.do?uri=%s_list.do%%3Fsysparm_query=active=true"
	PathRecord        = "%s/nav_to.do?uri=%s.do%%3Fsys_id=%s%%26sysparm_stack=%s_list.do%%3Fsysparm_query=active=true"
)
