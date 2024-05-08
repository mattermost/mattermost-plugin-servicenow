/**
 * Keep all service related types here
 */

type FetchChannelsParams = {
    teamId: string;
}

type SearchRecordsParams = {
    recordType: RecordType | ShareRecordType;
    search: string;
    perPage?: number;
}

type GetRecordParams = {
    recordType: RecordType | ShareRecordType;
    recordId: string;
}

type GetStatesParams = {
    recordType: RecordType;
}

type UpdateStatePayload = {
    recordType: RecordType;
    recordId: string;
    state: string;
}

type CreateSubscriptionPayload = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: SubscriptionType;
    record_type: RecordType;
    record_id: string;
    subscription_events: string;
    channel_id: string;
    record_number: string;
}

type FetchSubscriptionsParams = {
    page?: number;
    per_page?: number;
    channel_id?: string;
    user_id?: string;
}

type EditSubscriptionPayload = {
    server_url: string;
    is_active: boolean;
    user_id: string;
    type: SubscriptionType;
    record_type: RecordType;
    record_id: string;
    subscription_events: string;
    channel_id: string;
    sys_id: string;
    record_number: string;
}

type CommentsPayload = {
    record_type: string;
    record_id: string;
    comments?: string;
}

type ShareRecordPayload = {
    record_type: ShareRecordType;
    sys_id: string;
    channel_id: string;
}

interface PaginationQueryParams {
    page: number;
    per_page: number;
}

type SubscriptionFilters = {
    createdBy: string,
}

type IncidentPayload = {
    short_description: string;
    description: string;
    urgency?: number;
    impact?: number;
    caller_id: string;
    channel_id: string;
}
