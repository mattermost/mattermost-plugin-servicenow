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
    DOWNLOAD_UPDATE_SET_LINK,
    pluginApiServiceConfigs,
    MMUSERID,
    HeaderMattermostUserID,
};
