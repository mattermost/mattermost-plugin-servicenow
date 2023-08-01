// eslint-disable-next-line import/no-unresolved
import {BaseQueryApi} from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import {GlobalState} from 'mattermost-webapp/types/store';

import Constants from 'src/plugin_constants';
import Utils from 'src/utils';

const handleBaseQuery = async (
    args: {
        url: string,
        method: string,
    },
    api: BaseQueryApi,
    extraOptions: Record<string, string> = {},
) => {
    const globalReduxState = api.getState() as GlobalState;
    const result = await fetchBaseQuery({
        baseUrl: Utils.getBaseUrls(globalReduxState?.entities?.general?.config?.SiteURL).pluginApiBaseUrl,
        prepareHeaders: (headers) => {
            headers.set(Constants.HeaderCSRFToken, Cookies.get(Constants.MMCSRF) ?? '');

            return headers;
        },
    })(
        args,
        api,
        extraOptions,
    );
    return result;
};

// Service to make plugin API requests
const pluginApi = createApi({
    reducerPath: 'pluginApi',
    baseQuery: handleBaseQuery,
    tagTypes: ['Posts'],
    endpoints: (builder) => ({
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
        [Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName]: builder.query<ConnectedState, void>({
            query: () => ({
                headers: {[Constants.HeaderCSRFToken]: Cookies.get(Constants.MMCSRF)},
                url: Constants.pluginApiServiceConfigs.getConnectedUser.path,
                method: Constants.pluginApiServiceConfigs.getConnectedUser.method,
            }),
        }),
    }),
});

export default pluginApi;
