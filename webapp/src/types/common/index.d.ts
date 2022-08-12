/**
 * Keep all common types here which are to be used throughout the project
*/

type TabData = {
    title: string,
    tabPanel: JSX.Element
}

type HttpMethod = 'GET' | 'POST';

const pluginStateKey = 'plugins-mattermost-plugin-servicenow';

type ApiServiceName = 'fetchRecords'

type PluginApiService = {
    path: string,
    method: httpMethod,
    apiServiceName: string
}

type PluginState = {
    [pluginStateKey]: RootState<{ [x: string]: QueryDefinition<void, BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>, never, void, 'pluginApi'>; }, never, 'pluginApi'>
}

type DropdownOptionType = {
    label?: string | JSX.Element;
    value: string;
}

type ProjectDetails = {
    mattermostID: string
    projectID: string,
    projectName: string,
    organizationName: string
}

type SubscriptionDetails = {
    id: string
    name: string
    eventType: eventType
}

type EditSubscriptionData = {
    channel: string,
    recordValue: string,
    alertType: string,
    stateChanged: boolean;
    priorityChanged: boolean;
    newCommentChecked: boolean;
    assignedToChecked: boolean;
    assignmentGroupChecked: boolean;
}
