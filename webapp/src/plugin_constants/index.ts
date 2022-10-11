/**
* Keep all plugin related constants here
*/
export enum ToggleSwitchLabelPositioning {
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';
export const CONNECT_ACCOUNT_LINK = '/oauth2/connect';

const MMCSRF = 'MMCSRF';
const HeaderCSRFToken = 'X-CSRF-Token';
const MMUSERID = 'MMUSERID';
const RightSidebarHeader = 'Subscriptions';
const RhsToggleLabel = 'Show all subscriptions';
const InvalidAutoCompleteValueMsg = 'Invalid value, please select a value from the suggestions.';
const ChannelHeaderTooltipText = 'ServiceNow';
const DefaultCharThresholdToShowSuggestions = 3;
const DefaultPage = 0;
const DefaultPageSize = 100;
const ApiErrorIdNotConnected = 'not_connected';
const ApiErrorIdSubscriptionsNotConfigured = 'subscriptions_not_configured';
const ApiErrorIdSubscriptionsUnauthorized = 'subscriptions_not_authorized';
const GeneralErrorMessage = 'Something went wrong';
const GeneralErrorSubtitleForUser = 'Please contact your system administrator.';
const GeneralErrorSubtitleForAdmin = 'Please check the server logs.';
const SubscriptionAddedMsg = 'Subscription added successfully!';
const SubscriptionUpdatedMsg = 'Subscription updated successfully!';
const DeleteSubscriptionHeading = 'Confirm Subscription Delete';
const DeleteSubscriptionMsg = 'Are you sure you want to delete the subscription?';
const CharThresholdToSuggestChannel = 0;
const RequiredMsg = 'Required';

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

// Used in search records panel for rendering the key-value pairs of the record for showing the record details
const RecordDataLabelConfig: RecordDataLabelConfigType[] = [
    {
        key: 'short_description',
        label: 'Short Description',
    }, {
        key: 'state',
        label: 'State',
    }, {
        key: 'priority',
        label: 'Priority',
    }, {
        key: 'assigned_to',
        label: 'Assigned To',
    }, {
        key: 'assignment_group',
        label: 'Assignment Group',
    },
];

const KnowledgeRecordDataLabelConfig: RecordDataLabelConfigType[] = [
    {
        key: 'short_description',
        label: 'Short Description',
    }, {
        key: 'workflow_state',
        label: 'Workflow',
    }, {
        key: 'author',
        label: 'Author',
    }, {
        key: 'kb_category',
        label: 'Category',
    }, {
        key: 'kb_knowledge_base',
        label: 'Knowledge Base',
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

// Plugin api service (RTK query) configs
const pluginApiServiceConfigs: Record<ApiServiceName, PluginApiService> = {
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
    shareRecord: {
        path: '/share',
        method: 'POST',
        apiServiceName: 'shareRecord',
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
    DOWNLOAD_UPDATE_SET_LINK,
    pluginApiServiceConfigs,
    MMCSRF,
    HeaderCSRFToken,
    InvalidAutoCompleteValueMsg,
    RecordDataLabelConfig,
    KnowledgeRecordDataLabelConfig,
    MMUSERID,
    SubscriptionsConfigErrorTitle,
    SubscriptionsConfigErrorSubtitleForAdmin,
    SubscriptionsConfigErrorSubtitleForUser,
    ChannelHeaderTooltipText,
    RhsToggleLabel,
    DefaultCharThresholdToShowSuggestions,
    DefaultPage,
    DefaultPageSize,
    ApiErrorIdNotConnected,
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
    CharThresholdToSuggestChannel,
    RequiredMsg,
};
