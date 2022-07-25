import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

import Constants from 'plugin_constants';
import Utils from 'utils';

// Service to make plugin API requests
const pluginApi = createApi({
    reducerPath: 'pluginApi',
    baseQuery: fetchBaseQuery({baseUrl: Utils.getBaseUrls().pluginApiBaseUrl}),
    tagTypes: ['Posts'],
    endpoints: (builder) => ({
        [Constants.pluginApiServiceConfigs.fetchRecords.apiServiceName]: builder.query<void, void>({
            query: () => ({
                headers: {[Constants.HeaderMattermostUserID]: Cookies.get(Constants.MMUSERID)},
                url: Constants.pluginApiServiceConfigs.fetchRecords.path,
                method: Constants.pluginApiServiceConfigs.fetchRecords.method,
            }),
        }),
    }),
});

export default pluginApi;
