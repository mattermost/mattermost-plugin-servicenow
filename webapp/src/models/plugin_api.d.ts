/**
 * Keep all service related types here
 */

type ChannelList = {
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

type FetchChannelsParams = {
    teamId: string;
}

type RecordType = 'incident' | 'problem' | 'change_request';

type SearchRecordsParams = {
    recordType: RecordType;
    search: string;
    perPage?: number;
}

type GetRecordParams = {
    recordType: RecordType;
    recordId: string;
}

type Suggestion = {
    number: string;
    short_description: string;
    sys_id: string;
}

type RecordData = {
    assigned_to: string | { display_value: string, link: string };
    assignment_group: string | { display_value: string, link: string };
    number: string;
    priority: string;
    short_description: string;
    state: string;
    sys_id: string;
}

type CreateSubscriptionPayload = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: string;
    record_type: string;
    record_id: string;
    subscription_events: string;
    channel_id: string;
}

type FetchSubscriptionsParams = {
    page?: number;
    per_page?: number;
    channel_id?: string;
}

type SubscriptionData = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: string;
    record_type: string;
    record_id: string;
    subscription_events: string;
    channel_id: string;
    sys_id: string;
    number: string;
    short_description: string;
}

type EditSubscriptionPayload = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: string;
    record_type: string;
    record_id: string;
    subscription_events: string;
    channel_id: string;
    sys_id: string;
}
