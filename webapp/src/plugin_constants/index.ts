/**
 * Keep all plugin related constants here
*/

const RightSidebarHeader = 'Right Sidebar Placeholder Text';

export enum ToggleSwitchLabelPositioning{
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';

const MMCSRF = 'MMCSRF';
const HeaderCSRFToken = 'X-CSRF-Token';

const InvalidAutoCompleteValueMsg = 'Invalid value, please select a value from the suggestions.';

// 'short_description', 'state', 'priority', 'assigned_to', 'assignment_group'
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
};

export const PanelDefaultHeights = {
    channelPanel: 151,
    alertTypePanel: 195,
    searchRecordPanel: 203,
    searchRecordPanelExpanded: 360,
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
};
