type PluginState = RootState<{ [x: string]: QueryDefinition<void, BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>, never, void, 'pluginApi'>; }, never, 'pluginApi'>

type ReduxState = {
    'plugins-mattermost-plugin-servicenow': PluginState
}

type GlobalModalState = {
    modalId: ModalId;
    data?: EditSubscriptionData | CommentAndStateModalData | IncidentModalData | null;
}

type CommentModalState = {
    open: boolean;
    data?: CommentAndStateModalData;
}

type ConnectedState = {
    connected: boolean;
};

type SubscriptionModalState = {
    open: boolean;
    data?: EditSubscriptionData;
}

type RefetchState = {
    refetch: boolean;
};

type ShareRecordModalState = {
    open: boolean;
}

type UpdateStateModalReduxState = {
    open: boolean;
    data?: CommentAndStateModalData;
}

type CommentAndStateModalData = {
    recordType: RecordType;
    recordId: string;
}

type IncidentModalData = {
    description: string;
    senderId: string;
}
