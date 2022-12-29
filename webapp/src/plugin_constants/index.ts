/**
* Keep all plugin related constants here
*/
export enum ToggleSwitchLabelPositioning {
    Left = 'left',
    Right = 'right',
}

export const UPLOAD_SET_FILENAME = 'servicenow_for_mattermost_notifications_v2.2.xml';
export const CONNECT_ACCOUNT_LINK = '/oauth2/connect';
export const SERVICENOW_ICON_URL = 'servicenow-icon.png';
export const REQUEST_BASE_URL = 'com.glideapp.servicecatalog_cat_item_view.do?v=1&sysparm_id=';

const MMCSRF = 'MMCSRF';
const HeaderCSRFToken = 'X-CSRF-Token';
const MMUSERID = 'MMUSERID';
const RightSidebarHeader = 'ServiceNow';
const RhsSubscritpions = 'Subscriptions';
const ShareRecordButton = 'Share';
const RhsToggleLabel = 'Show all subscriptions';
const ChannelPanelToggleLabel = 'Subscribe to New Incident';
const InvalidAutoCompleteValueMsg = 'Invalid value, please select a value from the suggestions.';
const ChannelHeaderTooltipText = 'ServiceNow';
const DefaultCharThresholdToShowSuggestions = 3;
const DefaultPage = 0;
const DefaultPageSize = 20;
const ApiErrorIdNotConnected = 'not_connected';
const ApiErrorIdRefreshTokenExpired = 'refresh_token_expired';
const ApiErrorIdSubscriptionsNotConfigured = 'subscriptions_not_configured';
const ApiErrorIdSubscriptionsUnauthorized = 'subscriptions_not_authorized';
const GeneralErrorMessage = 'Something went wrong';
const GeneralErrorSubtitleForUser = 'Please contact your system administrator.';
const GeneralErrorSubtitleForAdmin = 'Please check the server logs.';
const SubscriptionAddedMsg = 'Subscription added successfully!';
const SubscriptionUpdatedMsg = 'Subscription updated successfully!';
const DeleteSubscriptionHeading = 'Confirm Subscription Delete';
const DeleteSubscriptionMsg = 'Are you sure you want to delete the subscription?';
const RecordSharedMsg = 'Record shared successfully!';
const StateUpdatedMsg = 'State updated successfully!';
const IncidentCreatedMsg = 'Incident created successfully!';
const CharThresholdToSuggestChannel = 0;
const CharThresholdToSuggestRequest = 4;
const RequiredMsg = 'Required';
const NoSubscriptionPresent = 'No more subscriptions present.';
const CommentsHeading = 'Comments';
const NoCommentsPresent = 'No more comments present.';
const CommentsNotFound = 'No comments found.';
const EmptyFieldsInServiceNow = 'N/A';
const ServiceNowSysIdRegex = '[0-9a-f]{32}';
const RequestButtonText = 'Submit Request on ServiceNow';
const RequestButtonRedirectText = 'You will be redirected to ServiceNow to complete this request';
const DefaultPerPageParam = 10;
const DebounceFunctionTimeLimit = 500;

export enum SubscriptionEvents {
    CREATED = 'created',
    STATE = 'state',
    PRIORITY = 'priority',
    COMMENTED = 'commented',
    ASSIGNED_TO = 'assigned_to',
    ASSIGNMENT_GROUP = 'assignment_group',
}

export enum SubscriptionType {
    RECORD = 'record',
    BULK = 'object',
}

export enum RecordType {
    INCIDENT = 'incident',
    PROBLEM = 'problem',
    CHANGE_REQUEST = 'change_request',
    KNOWLEDGE = 'kb_knowledge',
    TASK = 'task',
    CHANGE_TASK = 'change_task',
    FOLLOW_ON_TASK = 'cert_follow_on_task',
}

export const SubscriptionEventsMap: Record<string, SubscriptionEvents> = {
    created: SubscriptionEvents.CREATED,
    state: SubscriptionEvents.STATE,
    priority: SubscriptionEvents.PRIORITY,
    commented: SubscriptionEvents.COMMENTED,
    assigned_to: SubscriptionEvents.ASSIGNED_TO,
    assignment_group: SubscriptionEvents.ASSIGNMENT_GROUP,
};

const SubscriptionsConfigErrorTitle = 'It seems that subscriptions for ServiceNow have not been configured properly.';
const SubscriptionsConfigErrorSubtitleForUser = 'Please contact your system administrator to configure the subscriptions by following the instructions given by the plugin.';
const SubscriptionsConfigErrorSubtitleForAdmin = 'To enable subscriptions, you have to download the update set provided by the plugin and upload that in ServiceNow. The update set is available in the plugin configuration settings or you can download it by clicking the button below. The instructions for uploading the update set are available in the plugin\'s documentation and also can be viewed by running the "/servicenow help" command.';
const SubscriptionsUnauthorizedErrorTitle = 'It seems that you are not authorized to manage subscriptions in ServiceNow.';
const SubscriptionsUnauthorizedErrorSubtitleForUser = 'Please contact your system administrator to authorize you for managing subscriptions.';
const SubscriptionsUnauthorizedErrorSubtitleForAdmin = 'Please follow the instructions for setting up user permissions available in the plugin\'s documentation. The instructions can also be viewed by running the "/servicenow help" command.';

// Used to get the `SubscriptionType` labels to show in the UI
export const SubscriptionTypeLabelMap: Record<SubscriptionType, string> = {
    [SubscriptionType.RECORD]: 'Record subscription',
    [SubscriptionType.BULK]: 'Bulk subscription',
};

// Used to get the `RecordType` labels to show in the UI
export const RecordTypeLabelMap: Record<RecordType, string> = {
    [RecordType.INCIDENT]: 'Incident',
    [RecordType.PROBLEM]: 'Problem',
    [RecordType.CHANGE_REQUEST]: 'Change Request',
    [RecordType.KNOWLEDGE]: 'Knowledge',
    [RecordType.TASK]: 'Task',
    [RecordType.CHANGE_TASK]: 'Change Task',
    [RecordType.FOLLOW_ON_TASK]: 'Follow On Task',
};

const recordTypeOptions: DropdownOptionType[] = [
    {
        label: RecordTypeLabelMap[RecordType.INCIDENT],
        value: RecordType.INCIDENT,
    },
    {
        label: RecordTypeLabelMap[RecordType.PROBLEM],
        value: RecordType.PROBLEM,
    },
    {
        label: RecordTypeLabelMap[RecordType.CHANGE_REQUEST],
        value: RecordType.CHANGE_REQUEST,
    },
];

const shareRecordTypeOptions: DropdownOptionType[] = recordTypeOptions.concat([
    {
        label: RecordTypeLabelMap[RecordType.KNOWLEDGE],
        value: RecordType.KNOWLEDGE,
    },
    {
        label: RecordTypeLabelMap[RecordType.TASK],
        value: RecordType.TASK,
    },
    {
        label: RecordTypeLabelMap[RecordType.CHANGE_TASK],
        value: RecordType.CHANGE_TASK,
    },
    {
        label: RecordTypeLabelMap[RecordType.FOLLOW_ON_TASK],
        value: RecordType.FOLLOW_ON_TASK,
    },
]);

export enum RecordDataConfigKeys {
    SHORT_DESCRIPTION = 'short_description',
    STATE = 'state',
    PRIORITY = 'priority',
    ASSIGNED_TO = 'assigned_to',
    ASSIGNMENT_GROUP = 'assignment_group',
}

export enum RecordDataConfigLabels {
    SHORT_DESCRIPTION = 'Short Description',
    STATE = 'State',
    PRIORITY = 'Priority',
    ASSIGNED_TO = 'Assigned To',
    ASSIGNMENT_GROUP = 'Assignment Group',
}

// Used in search records panel for rendering the key-value pairs of the record for showing the record details
const RecordDataLabelConfig: RecordDataLabelConfigType[] = [
    {
        key: RecordDataConfigKeys.SHORT_DESCRIPTION,
        label: RecordDataConfigLabels.SHORT_DESCRIPTION,
    }, {
        key: RecordDataConfigKeys.STATE,
        label: RecordDataConfigLabels.STATE,
    }, {
        key: RecordDataConfigKeys.PRIORITY,
        label: RecordDataConfigLabels.PRIORITY,
    }, {
        key: RecordDataConfigKeys.ASSIGNED_TO,
        label: RecordDataConfigLabels.ASSIGNED_TO,
    }, {
        key: RecordDataConfigKeys.ASSIGNMENT_GROUP,
        label: RecordDataConfigLabels.ASSIGNMENT_GROUP,
    },
];

export enum SubscriptionFilters {
    ME = 'me',
    ANYONE = 'anyone',
}

export const DefaultSubscriptionFilters = {
    createdBy: SubscriptionFilters.ANYONE,
};

export const SubscriptionFilterCreatedByOptions = [
    {
        value: SubscriptionFilters.ME,
        label: 'Me',
    },
    {
        value: SubscriptionFilters.ANYONE,
        label: 'Anyone',
    },
];

export enum KnowledgeRecordDataConfigKeys {
    SHORT_DESCRIPTION = 'short_description',
    WORKFLOW_STATE = 'workflow_state',
    AUTHOR = 'author',
    CATEGORY = 'kb_category',
    KNOWLEDGE_BASE = 'kb_knowledge_base',
}

export enum KnowledgeRecordDataConfigLabels {
    SHORT_DESCRIPTION = 'Short Description',
    WORKFLOW_STATE = 'Workflow',
    AUTHOR = 'Author',
    CATEGORY = 'Category',
    KNOWLEDGE_BASE = 'Knowledge Base',
}

const KnowledgeRecordDataLabelConfig: RecordDataLabelConfigType[] = [
    {
        key: KnowledgeRecordDataConfigKeys.SHORT_DESCRIPTION,
        label: KnowledgeRecordDataConfigLabels.SHORT_DESCRIPTION,
    }, {
        key: KnowledgeRecordDataConfigKeys.WORKFLOW_STATE,
        label: KnowledgeRecordDataConfigLabels.WORKFLOW_STATE,
    }, {
        key: KnowledgeRecordDataConfigKeys.AUTHOR,
        label: KnowledgeRecordDataConfigLabels.AUTHOR,
    }, {
        key: KnowledgeRecordDataConfigKeys.CATEGORY,
        label: KnowledgeRecordDataConfigLabels.CATEGORY,
    }, {
        key: KnowledgeRecordDataConfigKeys.KNOWLEDGE_BASE,
        label: KnowledgeRecordDataConfigLabels.KNOWLEDGE_BASE,
    },
];

export enum RequestDataLabelConfigKey {
    SHORT_DESCRIPTION = 'short_description',
    PRICE = 'price',
    CATEGORY = 'title',
}

const RequestDataLabelConfig = [
    {
        key: RequestDataLabelConfigKey.SHORT_DESCRIPTION,
        label: 'Short Description',
    }, {
        key: RequestDataLabelConfigKey.CATEGORY,
        label: 'Category',
    }, {
        key: RequestDataLabelConfigKey.PRICE,
        label: 'Price',
    },
];

// Map subscription events to texts to be shown in the UI(on cards)
export const SubscriptionEventLabels: Record<SubscriptionEvents, string> = {
    [SubscriptionEvents.CREATED]: 'New record created',
    [SubscriptionEvents.STATE]: 'State changed',
    [SubscriptionEvents.PRIORITY]: 'Priority changed',
    [SubscriptionEvents.COMMENTED]: 'New comment',
    [SubscriptionEvents.ASSIGNED_TO]: 'Assigned to changed',
    [SubscriptionEvents.ASSIGNMENT_GROUP]: 'Assignment group changed',
};

export const DefaultIncidentImpactAndUrgencyOptions: DropdownOptionType[] = [
    {
        value: '1 - High',
        label: 'High',
    },
    {
        value: '2 - Medium',
        label: 'Medium',
    },
    {
        value: '3 - Low',
        label: 'Low',
    },
];

export const RecordTypesSupportingComments = new Set([
    RecordType.INCIDENT,
    RecordType.PROBLEM,
    RecordType.CHANGE_REQUEST,
    RecordType.TASK,
    RecordType.CHANGE_TASK,
    RecordType.FOLLOW_ON_TASK,
]);

export const RecordTypesSupportingStateUpdation = new Set([
    RecordType.INCIDENT,
    RecordType.TASK,
    RecordType.CHANGE_TASK,
    RecordType.FOLLOW_ON_TASK,
]);

export const KeysContainingLink = new Set([
    KnowledgeRecordDataConfigKeys.KNOWLEDGE_BASE,
    KnowledgeRecordDataConfigKeys.AUTHOR,
    KnowledgeRecordDataConfigKeys.CATEGORY,
    RecordDataConfigKeys.ASSIGNED_TO,
    RecordDataConfigKeys.ASSIGNMENT_GROUP,
    KnowledgeRecordDataConfigLabels.KNOWLEDGE_BASE,
    KnowledgeRecordDataConfigLabels.AUTHOR,
    KnowledgeRecordDataConfigLabels.CATEGORY,
    RecordDataConfigLabels.ASSIGNED_TO,
    RecordDataConfigLabels.ASSIGNMENT_GROUP,
]);

export type TypesContainingLink = KnowledgeRecordDataConfigKeys | RecordDataConfigKeys | KnowledgeRecordDataConfigLabels | RecordDataConfigLabels;

// Plugin api service (RTK query) configs
const pluginApiServiceConfigs: Record<ApiServiceName, PluginApiService> = {
    getConnectedUser: {
        path: '/connected',
        method: 'GET',
        apiServiceName: 'getConnectedUser',
    },
    checkSubscriptionsConfigured: {
        path: '/subscriptions-configured',
        method: 'GET',
        apiServiceName: 'checkSubscriptionsConfigured',
    },
    getChannels: {
        path: '/channels',
        method: 'GET',
        apiServiceName: 'getChannels',
    },
    searchRecords: {
        path: '/records',
        method: 'GET',
        apiServiceName: 'searchRecords',
    },
    getRecord: {
        path: '/records',
        method: 'GET',
        apiServiceName: 'getRecord',
    },
    createSubscription: {
        path: '/subscriptions',
        method: 'POST',
        apiServiceName: 'createSubscription',
    },
    fetchSubscriptions: {
        path: '/subscriptions',
        method: 'GET',
        apiServiceName: 'fetchSubscriptions',
    },
    fetchSubscription: {
        path: '/subscriptions',
        method: 'GET',
        apiServiceName: 'fetchSubscription',
    },
    editSubscription: {
        path: '/subscriptions',
        method: 'PATCH',
        apiServiceName: 'editSubscription',
    },
    deleteSubscription: {
        path: '/subscriptions',
        method: 'DELETE',
        apiServiceName: 'deleteSubscription',
    },
    getConfig: {
        path: '/config',
        method: 'GET',
        apiServiceName: 'getConfig',
    },
    getComments: {
        path: '/comments',
        method: 'GET',
        apiServiceName: 'getComments',
    },
    addComments: {
        path: '/comments',
        method: 'POST',
        apiServiceName: 'addComments',
    },
    shareRecord: {
        path: '/share',
        method: 'POST',
        apiServiceName: 'shareRecord',
    },
    getStates: {
        path: '/states',
        method: 'GET',
        apiServiceName: 'getStates',
    },
    updateState: {
        path: '/states',
        method: 'PATCH',
        apiServiceName: 'updateState',
    },
    searchItems: {
        path: '/catalog',
        method: 'GET',
        apiServiceName: 'searchItems',
    },
    getUsers: {
        path: '/users',
        method: 'GET',
        apiServiceName: 'getUsers',
    },
    createIncident: {
        path: '/incident',
        method: 'POST',
        apiServiceName: 'createIncident',
    },
    getIncidentFeilds: {
        path: '/incident-fields',
        method: 'GET',
        apiServiceName: 'getIncidentFeilds',
    },
};

export const PanelDefaultHeights = {
    channelPanel: 210,
    subscriptionTypePanel: 195,
    recordTypePanel: 210,
    searchRecordPanel: 210,
    searchRecordPanelExpanded: 335,
    eventsPanel: 500,
    successPanel: 220,
    panelHeader: 65,
};

export default {
    RightSidebarHeader,
    RhsSubscritpions,
    ShareRecordButton,
    UPLOAD_SET_FILENAME,
    SERVICENOW_ICON_URL,
    REQUEST_BASE_URL,
    pluginApiServiceConfigs,
    MMCSRF,
    HeaderCSRFToken,
    InvalidAutoCompleteValueMsg,
    RecordDataLabelConfig,
    KnowledgeRecordDataLabelConfig,
    RequestDataLabelConfig,
    MMUSERID,
    SubscriptionsConfigErrorTitle,
    SubscriptionsConfigErrorSubtitleForAdmin,
    SubscriptionsConfigErrorSubtitleForUser,
    ChannelHeaderTooltipText,
    RhsToggleLabel,
    ChannelPanelToggleLabel,
    DefaultCharThresholdToShowSuggestions,
    DefaultPage,
    DefaultPageSize,
    ApiErrorIdNotConnected,
    ApiErrorIdRefreshTokenExpired,
    ApiErrorIdSubscriptionsNotConfigured,
    ApiErrorIdSubscriptionsUnauthorized,
    SubscriptionsUnauthorizedErrorTitle,
    SubscriptionsUnauthorizedErrorSubtitleForUser,
    SubscriptionsUnauthorizedErrorSubtitleForAdmin,
    GeneralErrorMessage,
    GeneralErrorSubtitleForUser,
    GeneralErrorSubtitleForAdmin,
    SubscriptionAddedMsg,
    SubscriptionUpdatedMsg,
    DeleteSubscriptionHeading,
    DeleteSubscriptionMsg,
    RecordSharedMsg,
    StateUpdatedMsg,
    IncidentCreatedMsg,
    CharThresholdToSuggestChannel,
    CharThresholdToSuggestRequest,
    RequiredMsg,
    recordTypeOptions,
    shareRecordTypeOptions,
    NoSubscriptionPresent,
    CommentsHeading,
    NoCommentsPresent,
    CommentsNotFound,
    SubscriptionFilters,
    DefaultSubscriptionFilters,
    SubscriptionFilterCreatedByOptions,
    EmptyFieldsInServiceNow,
    ServiceNowSysIdRegex,
    RequestButtonText,
    RequestButtonRedirectText,
    DefaultPerPageParam,
    DebounceFunctionTimeLimit,
};
