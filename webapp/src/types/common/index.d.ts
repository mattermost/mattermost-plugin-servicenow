/**
 * Keep all common types here which are to be used throughout the project
*/

type TabData = {
    title: string,
    tabPanel: JSX.Element
}

type HttpMethod = 'GET' | 'POST';

type ApiServiceName = 'getChannels' | 'searchRecords' | 'getRecord' | 'createSubscription' | 'fetchSubscriptions' | 'editSubscription' | 'deleteSubscription'

type PluginApiService = {
    path: string,
    method: httpMethod,
    apiServiceName: string
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

type APIPayloadType = FetchChannelsParams | SearchRecordsParams | GetRecordParams | CreateSubscriptionPayload | FetchSubscriptionsParams | EditSubscriptionPayload | string;

type SubscriptionCardBody = {
    list?: string[] | JSX.Element[],
    labelValuePairs?: [
        {
            label: string,
            value: string,
        }
    ]
}
