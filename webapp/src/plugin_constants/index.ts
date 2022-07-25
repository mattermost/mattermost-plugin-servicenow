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

export default {
    RightSidebarHeader,
    DOWNLOAD_UPDATE_SET_LINK,
    pluginApiServiceConfigs,
    MMUSERID,
    HeaderMattermostUserID,
};
