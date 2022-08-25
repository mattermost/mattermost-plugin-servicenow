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
const DefaultCharThresholdToShowSuggestions = 4;
const DefaultPage = 0;
const DefaultPageSize = 100;
const PrivateChannelType = 'P';
const ApiErrorIdNotConnected = 'not_connected';
const ApiErrorIdSubscriptionsNotConfigured = 'subscriptions_not_configured';
const ApiErrorIdSubscriptionsUnauthorized = 'subscriptions_not_authorized';

export enum SubscriptionEvents {
    state = 'state',
    priority = 'priority',
    commented = 'commented',
    assignedTo = 'assigned_to',
    assignmentGroup = 'assignment_group',
}

export const SubscriptionEventsMap: Record<string, SubscriptionEvents> = {
    state: SubscriptionEvents.state,
    priority: SubscriptionEvents.priority,
    commented: SubscriptionEvents.commented,
    assigned_to: SubscriptionEvents.assignedTo,
    assignment_group: SubscriptionEvents.assignmentGroup,
};

const SubscriptionsConfigErrorTitle = 'It seems that subscriptions for ServiceNow have not been configured properly.';
const SubscriptionsConfigErrorSubtitleForUser = 'Please contact your system administrator to configure the subscriptions by following the instructions given by the plugin.';
const SubscriptionsConfigErrorSubtitleForAdmin = 'To enable subscriptions, you have to download the update set provided by the plugin and upload that in ServiceNow. The update set is available in the plugin configuration settings or you can download it by clicking the button below. The instructions for uploading the update set are available in the plugin\'s documentation and also can be viewed by running the "/servicenow help" command.';
const SubscriptionsUnauthorizedErrorTitle = 'It seems that you are not authorized to manage subscriptions in ServiceNow.';
const SubscriptionsUnauthorizedErrorSubtitleForUser = 'Please contact your system administrator.';
const SubscriptionsUnauthorizedErrorSubtitleForAdmin = 'Please follow the instructions for setting up user permissions available in the plugin\'s documentation. The instructions can also be viewed by running the "/servicenow help" command.';

// Used to get the `SubscriptionType` labels to show in the subscription card
export const SubscriptionTypeLabelMap: Record<string, string> = {
    record: 'Record subscription',
    object: 'Bulk subscription',
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

// Map subscription events to texts to be shown in the UI(on cards)
const SubscriptionEventLabels: Record<string, string> = {
    state: 'State changed',
    priority: 'Priority changed',
    commented: 'New comment',
    assigned_to: 'Assigned to changed',
    assignment_group: 'Assignment group changed',
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
};

export const PanelDefaultHeights = {
    channelPanel: 151,
    recordTypePanel: 195,
    searchRecordPanel: 203,
    searchRecordPanelExpanded: 372,
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
    MMUSERID,
    SubscriptionsConfigErrorTitle,
    SubscriptionsConfigErrorSubtitleForAdmin,
    SubscriptionsConfigErrorSubtitleForUser,
    ChannelHeaderTooltipText,
    RhsToggleLabel,
    DefaultCharThresholdToShowSuggestions,
    SubscriptionEventLabels,
    DefaultPage,
    DefaultPageSize,
    PrivateChannelType,
    ApiErrorIdNotConnected,
    ApiErrorIdSubscriptionsNotConfigured,
    ApiErrorIdSubscriptionsUnauthorized,
    SubscriptionsUnauthorizedErrorTitle,
    SubscriptionsUnauthorizedErrorSubtitleForUser,
    SubscriptionsUnauthorizedErrorSubtitleForAdmin,
};
