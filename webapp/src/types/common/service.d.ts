type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiServiceName =
    'getChannels' |
    'searchRecords' |
    'getRecord' |
    'createSubscription' |
    'fetchSubscriptions' |
    'editSubscription' |
    'deleteSubscription' |
    'getConfig' |
    'shareRecord' |
    'getComments' |
    'addComments' |
    'getStates' |
    'updateState' |
    'searchItems';

type PluginApiService = {
    path: string,
    method: httpMethod,
    apiServiceName: ApiServiceName,
}

type APIError = {
    id: string,
    message: string,
}

type APIPayloadType =
    FetchChannelsParams |
    SearchRecordsParams |
    GetRecordParams |
    CreateSubscriptionPayload |
    FetchSubscriptionsParams |
    EditSubscriptionPayload |
    ShareRecordPayload |
    CommentsPayload |
    GetStatesParams |
    UpdateStateParams |
    string;
