/**
 * Keep all common types here which are to be used throughout the project
*/

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiServiceName = 'getChannels' | 'searchRecords' | 'getRecord' | 'createSubscription' | 'fetchSubscriptions' | 'editSubscription' | 'deleteSubscription' | 'getConfig' | 'getComments' | 'addComments';

type PluginApiService = {
    path: string,
    method: httpMethod,
    apiServiceName: ApiServiceName,
}

type PluginState = {
    'plugins-mattermost-plugin-servicenow': RootState<{ [x: string]: QueryDefinition<void, BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>, never, void, 'pluginApi'>; }, never, 'pluginApi'>
}

type DropdownOptionType = {
    label?: string | JSX.Element;
    value: string;
}

type MmHookArgTypes = {
    channel_id: string,
    team_id: string,
    root_id: string
}

type EditSubscriptionData = {
    channel: string,
    type: SubscriptionType,
    recordId: string,
    recordType: RecordType,
    subscriptionEvents: import('../../plugin_constants').SubscriptionEvents[],
    id: string;
}

type RecordDataKeys = 'short_description' | 'state' | 'priority' | 'assigned_to' | 'assignment_group';

type RecordDataLabelConfigType = {
    key: RecordDataKeys;
    label: string;
}

type APIPayloadType = FetchChannelsParams | SearchRecordsParams | GetRecordParams | CreateSubscriptionPayload | FetchSubscriptionsParams | EditSubscriptionPayload | CommentsPayload | string;

type APIError = {
    id: string,
    message: string,
}

type WebsocketEventParams = {
    event: string,
    data: Record<string, string>,
}

type SubscriptionCardBody = {
    list?: Array<string | JSX.Element>,
    labelValuePairs?: Array<{label: string, value: string}>,
}

type CommentModalData = {
    recordType: RecordType;
    recordId: string;
}
