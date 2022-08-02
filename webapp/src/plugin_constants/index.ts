/**
 * Keep all plugin related constants here
*/

const RightSidebarHeader = 'Right Sidebar Placeholder Text';

export enum ToggleSwitchLabelPositioning{
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';

const MMUSERID = 'MMUSERID';
const HeaderMattermostUserID = 'User-ID';

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
    MMUSERID,
    HeaderMattermostUserID,
};
