import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

import Constants from 'src/plugin_constants';
import Utils from 'src/utils';

// Service to make plugin API requests
const pluginApi = createApi({
    reducerPath: 'pluginApi',
    baseQuery: fetchBaseQuery({baseUrl: Utils.getBaseUrls().pluginApiBaseUrl}),
    tagTypes: ['Posts'],
    endpoints: (builder) => ({
        [Constants.pluginApiServiceConfigs.checkSubscriptionsConfigured.apiServiceName]: builder.query<void, void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.checkSubscriptionsConfigured.path,
                method: Constants.pluginApiServiceConfigs.checkSubscriptionsConfigured.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName]: builder.query<ConnectedState, void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.getConnectedUser.path,
                method: Constants.pluginApiServiceConfigs.getConnectedUser.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.getChannels.apiServiceName]: builder.query<ChannelData[], FetchChannelsParams>({
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
                params: {search, perPage: perPage || Constants.DefaultPerPageParam},
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
        [Constants.pluginApiServiceConfigs.fetchSubscription.apiServiceName]: builder.query<SubscriptionData, string>({
            query: (id) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.fetchSubscription.path}/${id}`,
                method: Constants.pluginApiServiceConfigs.fetchSubscription.method,
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
        [Constants.pluginApiServiceConfigs.getConfig.apiServiceName]: builder.query<ConfigData, void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.getConfig.path}`,
                method: Constants.pluginApiServiceConfigs.getConfig.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.getComments.apiServiceName]: builder.query<string, CommentsPayload>({
            query: ({record_type, record_id}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.getComments.path}/${record_type}/${record_id}`,
                method: Constants.pluginApiServiceConfigs.getComments.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.addComments.apiServiceName]: builder.query<void, CommentsPayload>({
            query: ({record_type, record_id, ...body}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.addComments.path}/${record_type}/${record_id}`,
                method: Constants.pluginApiServiceConfigs.addComments.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.shareRecord.apiServiceName]: builder.query<void, ShareRecordPayload>({
            query: (body) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.shareRecord.path}/${body.channel_id}`,
                method: Constants.pluginApiServiceConfigs.shareRecord.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.getStates.apiServiceName]: builder.query<StateData[], GetStatesParams>({
            query: (params) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.getStates.path}/${params.recordType}`,
                method: Constants.pluginApiServiceConfigs.getStates.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.updateState.apiServiceName]: builder.query<void, UpdateStatePayload>({
            query: ({recordType, recordId, ...body}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: `${Constants.pluginApiServiceConfigs.updateState.path}/${recordType}/${recordId}`,
                method: Constants.pluginApiServiceConfigs.updateState.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.searchItems.apiServiceName]: builder.query<RequestData[], SearchItemsParams>({
            query: ({search, perPage}) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.searchItems.path,
                method: Constants.pluginApiServiceConfigs.searchItems.method,
                params: {search, perPage: perPage || Constants.DefaultPerPageParam},
            }),
        }),
        [Constants.pluginApiServiceConfigs.getUsers.apiServiceName]: builder.query<CallerData[], void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.getUsers.path,
                method: Constants.pluginApiServiceConfigs.getUsers.method,
            }),
        }),
        [Constants.pluginApiServiceConfigs.createIncident.apiServiceName]: builder.query<RecordData, IncidentPayload>({
            query: (body) => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.createIncident.path,
                method: Constants.pluginApiServiceConfigs.createIncident.method,
                body,
            }),
        }),
        [Constants.pluginApiServiceConfigs.getIncidentFeilds.apiServiceName]: builder.query<IncidentFieldsData[], void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.getIncidentFeilds.path,
                method: Constants.pluginApiServiceConfigs.getIncidentFeilds.method,
            }),
        }),
    }),
});

export default pluginApi;
