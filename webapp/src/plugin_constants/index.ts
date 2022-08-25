/**
* Keep all plugin related constants here
*/
export enum ToggleSwitchLabelPositioning {
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';

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

export enum SubscriptionEvents {
    state = 'state',
    priority = 'priority',
    commented = 'commented',
    assignedTo = 'assigned_to',
    assignmentGroup = 'assignment_group',
}

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
        apiServiceName: 'editSubscriptions',
    },
    deleteSubscription: {
        path: '/subscriptions',
        method: 'DELETE',
        apiServiceName: 'deleteSubscriptions',
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
    ChannelHeaderTooltipText,
    RhsToggleLabel,
    DefaultCharThresholdToShowSuggestions,
    SubscriptionEventLabels,
    DefaultPage,
    DefaultPageSize,
    PrivateChannelType,
};
