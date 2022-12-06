/**
 * Keep all common types here which are to be used throughout the project
*/

// TODO: Create an enum for the below modal Ids
type ModalId = 'addSubscription' | 'editSubscription' | 'shareRecord' | 'addOrViewComments' | 'updateState' | 'createIncident' | null
type SubscriptionType = import('../../plugin_constants').SubscriptionType;
type RecordType = import('../../plugin_constants').RecordType;

type ChannelData = {
    create_at: number;
    creator_id: string;
    delete_at: number;
    display_name: string;
    extra_update_at: number;
    group_constrained: null | string;
    header: string;
    id: string;
    last_post_at: number;
    last_root_post_at: number;
    name: string;
    policy_id: null | unknown;
    props: null | unknown;
    purpose: string;
    scheme_id: null | string;
    shared: null | string;
    team_display_name: string;
    team_id: string;
    team_name: string;
    team_update_at: number;
    total_msg_count: number;
    total_msg_count_root: number;
    type: string;
    update_at: number;
};

type Suggestion = {
    number: string;
    short_description: string;
    sys_id: string;
}

type RecordData = {
    assigned_to: string | LinkData;
    assignment_group: string | LinkData;
    number: string;
    priority: string;
    short_description: string;
    state: string;
    sys_id: string;
    author: string | LinkData;
    kb_category: string | LinkData;
    kb_knowledge_base: string | LinkData;
    workflow_state: string;
}

type SubscriptionData = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: SubscriptionType;
    record_type: RecordType;
    record_id: string;
    subscription_events: string;
    channel_id: string;
    sys_id: string;
    number: string;
    short_description: string;
}

type ConfigData = {
    ServiceNowBaseURL: string;
    ServiceNowOAuthClientID: string;
    ServiceNowOAuthClientSecret: string;
    EncryptionSecret: string;
    WebhookSecret: string;
    ServiceNowUpdateSetDownload: string;
}

type LinkData = {
    display_value: string;
    link: string;
}

type StateData = {
    label: string;
    value: string;
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

type RecordDataKeys = 'short_description' | 'state' | 'priority' | 'assigned_to' | 'assignment_group' | 'workflow_state' | 'author' | 'kb_category' | 'kb_knowledge_base';

type RecordDataLabelConfigType = {
    key: RecordDataKeys;
    label: string;
}

type WebsocketEventParams = {
    event: string,
    data: Record<string, string>,
}

type SubscriptionCardBody = {
    list?: Array<string | JSX.Element>,
    labelValuePairs?: Array<{ label: string, value: string }>,
}

type ServiceNowUser = {
    sys_id: string;
    email: string;
    user_name: string;
}

type CallerData = {
    mattermostUserID: string;
    username: string;
    serviceNowUser: ServiceNowUser;
}

type IncidentFieldsData = {
    label: string;
    value: string;
    element: string;
}
