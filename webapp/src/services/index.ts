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
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.getChannels.path}/${params.teamId}`,
                method: Constants.pluginApiServiceConfigs.getChannels.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.searchRecords.apiServiceName]: builder.query<Suggestion[], SearchRecordsParams>({
            query: ({recordType, search, perPage}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.searchRecords.path}/${recordType}`,
                method: Constants.pluginApiServiceConfigs.searchRecords.method,
                params: {search, perPage: perPage || 10},
            }),
        }),
        [Constants.pluginApiServiceConfigs.getRecord.apiServiceName]: builder.query<RecordData, GetRecordParams>({
            query: (params) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.getRecord.path}/${params.recordType}/${params.recordId}`,
                method: Constants.pluginApiServiceConfigs.getRecord.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.createSubscription.apiServiceName]: builder.query<void, CreateSubscriptionPayload>({
            query: (body) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.createSubscription.path}`,
                method: Constants.pluginApiServiceConfigs.createSubscription.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName]: builder.query<SubscriptionData[], FetchSubscriptionsParams>({
            query: (params) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.fetchSubscriptions.path}`,
                method: Constants.pluginApiServiceConfigs.fetchSubscriptions.method,
                params,
            }),
        }),
        [Constants.pluginApiServiceConfigs.editSubscription.apiServiceName]: builder.query<void, EditSubscriptionPayload>({
            query: ({sys_id, ...body}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.editSubscription.path}/${sys_id}`,
                method: Constants.pluginApiServiceConfigs.editSubscription.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName]: builder.query<void, string>({
            query: (id) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.deleteSubscription.path}/${id}`,
                method: Constants.pluginApiServiceConfigs.deleteSubscription.method,
            }),
        }),
    }),
});

export default pluginApi;
