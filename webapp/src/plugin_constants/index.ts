/**
* Keep all plugin related constants here
*/
export enum ToggleSwitchLabelPositioning {
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';

const RightSidebarHeader = 'Right Sidebar Placeholder Text';
const MMUSERID = 'MMUSERID';
const HeaderMattermostUserID = 'Mattermost-User-ID';
const RhsToggleLabel = 'Show all subscriptions';

// Plugin api service (RTK query) configs
const pluginApiServiceConfigs: Record<ApiServiceName, PluginApiService> = {
    fetchRecords: {
        path: '/fetch-records',
        method: 'GET',
        apiServiceName: 'fetchRecords',
    },
};

export const PanelDefaultHeights = {
    channelPanel: 151,
    recordTypePanel: 195,
    searchRecordPanel: 203,
    searchRecordPanelExpanded: 360,
    eventsPanel: 500,
    successPanel: 220,
    panelHeader: 65,
};

const ChannelHeaderTooltipText = 'ServiceNow';

const DefaultCharThresholdToShowSuggestions = 4;

export default {
    RightSidebarHeader,
    DOWNLOAD_UPDATE_SET_LINK,
    pluginApiServiceConfigs,
    MMUSERID,
    HeaderMattermostUserID,
    ChannelHeaderTooltipText,
    RhsToggleLabel,
    DefaultCharThresholdToShowSuggestions,
};
