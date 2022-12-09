import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-webapp/types/store';

import {ModalId, SubscriptionEventsMap} from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {setGlobalModalState, resetGlobalModalState} from 'src/reducers/globalModal';
import {refetch} from 'src/reducers/refetchState';

export function handleConnect(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(true) as Action);
        const {rhsState, pluggableId} = (store.getState() as GlobalState).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleDisconnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(false) as Action);
        store.dispatch(resetGlobalModalState() as Action);
    };
}

export function handleOpenAddSubscriptionModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalId.ADD_SUBSCRIPTION}) as Action);
    };
}

export function handleOpenEditSubscriptionModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const events = data.subscription_events.split(',');
        const subscriptionEvents = events.map((event) => SubscriptionEventsMap[event]);
        const subscriptionData: EditSubscriptionData = {
            channel: data.channel_id,
            type: data.type as SubscriptionType,
            recordId: data.record_id,
            id: data.sys_id,
            recordType: data.record_type as RecordType,
            subscriptionEvents,
        };
        store.dispatch(setGlobalModalState({modalId: ModalId.EDIT_SUBSCRIPTION, data: subscriptionData}) as Action);
    };
}

export function handleSubscriptionDeleted(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        const {rhsState, pluggableId} = (store.getState() as GlobalState).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleOpenShareRecordModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalId.SHARE_RECORD}) as Action);
    };
}

export function handleOpenCommentModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const commentModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: ModalId.ADD_OR_VIEW_COMMENTS, data: commentModalData}) as Action);
    };
}

export function handleOpenUpdateStateModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const updateStateModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: ModalId.UPDATE_STATE, data: updateStateModalData}) as Action);
    };
}

export function handleOpenIncidentModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalId.CREATE_INCIDENT}) as Action);
    };
}

export function handleOpenRequestModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalId.CREATE_REQUEST}) as Action);
    };
}
