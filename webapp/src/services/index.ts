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
        [Constants.pluginApiServiceConfigs.getChannels.apiServiceName]: builder.query<ChannelList[], FetchChannelsParams>({
            query: (params) => ({
                headers: {[Constants.HeaderMattermostUserID]: Cookies.get(Constants.MMUSERID)},
                url: `${Constants.pluginApiServiceConfigs.getChannels.path}/${params.teamId}`,
                method: Constants.pluginApiServiceConfigs.getChannels.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.searchRecords.apiServiceName]: builder.query<Suggestion[], SearchRecordsParams>({
            query: ({recordType, search, perPage}) => ({
                headers: {[Constants.HeaderMattermostUserID]: Cookies.get(Constants.MMUSERID)},
                url: `${Constants.pluginApiServiceConfigs.searchRecords.path}/${recordType}`,
                method: Constants.pluginApiServiceConfigs.searchRecords.method,
                params: {search, perPage: perPage || 10},
            }),
        }),
        [Constants.pluginApiServiceConfigs.getRecord.apiServiceName]: builder.query<RecordData, GetRecordParams | void>({
            query: (params) => ({
                headers: {[Constants.HeaderMattermostUserID]: Cookies.get(Constants.MMUSERID)},
                url: `${Constants.pluginApiServiceConfigs.getRecord.path}/${params?.recordType}/${params?.recordId}`,
                method: Constants.pluginApiServiceConfigs.getRecord.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.createSubscription.apiServiceName]: builder.query<void, CreateSubscriptionPayload | void>({
            query: (body) => ({
                headers: {[Constants.HeaderMattermostUserID]: Cookies.get(Constants.MMUSERID)},
                url: `${Constants.pluginApiServiceConfigs.createSubscription.path}`,
                method: Constants.pluginApiServiceConfigs.createSubscription.method,
                body,
            }),
        }),
    }),
});

export default pluginApi;
