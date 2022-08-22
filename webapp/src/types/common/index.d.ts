/**
 * Keep all common types here which are to be used throughout the project
*/

type TabData = {
    title: string,
    tabPanel: JSX.Element
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiServiceName = 'getChannels' | 'searchRecords' | 'getRecord' | 'createSubscription' | 'fetchSubscriptions' | 'editSubscription' | 'deleteSubscription'

type PluginApiService = {
    path: string,
    method: httpMethod,
    apiServiceName: ApiServiceName,
}

type PluginState = {
    'plugins-mattermost-plugin-servicenow': RootState<{ [x: string]: QueryDefinition<void, BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>, never, ChannelList[], 'pluginApi'>; }, never, 'pluginApi'>
}

type DropdownOptionType = {
    label?: string | JSX.Element;
    value: string;
}

type EditSubscriptionData = {
    channel: string,
    recordId: string,
    alertType: RecordType,
    stateChanged: boolean;
    priorityChanged: boolean;
    newCommentChecked: boolean;
    assignedToChecked: boolean;
    assignmentGroupChecked: boolean;
    id: string;
}

type RecordDataKeys = 'short_description' | 'state' | 'priority' | 'assigned_to' | 'assignment_group';

type RecordDataLabelConfigType = {
    key: RecordDataKeys;
    label: string;
}

type APIPayloadType = FetchChannelsParams | SearchRecordsParams | GetRecordParams | CreateSubscriptionPayload | FetchSubscriptionsParams | EditSubscriptionPayload | DeleteSubscriptionPayload;

type APIError = {
    id: string,
    message: string,
}

type WebsocketEventParams = {
    event: string,
    data: Record<string, string>,
}
