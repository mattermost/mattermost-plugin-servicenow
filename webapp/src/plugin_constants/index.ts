/**
* Keep all plugin related constants here
*/
export enum ToggleSwitchLabelPositioning{
    Left = 'left',
    Right = 'right',
}

export const DOWNLOAD_UPDATE_SET_LINK = '/download';

const RightSidebarHeader = 'Right Sidebar Placeholder Text';
const MMUSERID = 'MMUSERID';
const HeaderMattermostUserID = 'Mattermost-User-ID';

// Plugin api service (RTK query) configs
const pluginApiServiceConfigs: Record<ApiServiceName, PluginApiService> = {
    fetchRecords: {
        path: '/fetch-records',
        method: 'GET',
        apiServiceName: 'fetchRecords',
    },
};

const ChannelHeaderTooltipText = 'ServiceNow';

export default {
    RightSidebarHeader,
    DOWNLOAD_UPDATE_SET_LINK,
    pluginApiServiceConfigs,
    MMUSERID,
    HeaderMattermostUserID,
    ChannelHeaderTooltipText,
};
