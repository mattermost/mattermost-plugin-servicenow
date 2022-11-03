import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

import {SubscriptionEventsMap} from 'plugin_constants';

import {setConnected} from 'reducers/connectedState';
import {refetch} from 'reducers/refetchState';
import {showModal as showAddSubcriptionModal, hideModal as hideAddSubscriptionModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditSubcriptionModal, hideModal as hideEditSubscriptionModal} from 'reducers/editSubscriptionModal';
import {showModal as showShareRecordModal, hideModal as hideShareRecordModal} from 'reducers/shareRecordModal';
import {showModal as showCommentModal, hideModal as hideCommentModal} from 'reducers/commentModal';
import {showModal as showUpdateStateModal, hideModal as hideUpdateStateModal} from 'reducers/updateStateModal';

export function handleConnect(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(true) as Action);

        // TODO: Fix the type of state below by importing the GlobalState from mattermost-webapp
        const {rhsState, pluggableId} = (store.getState() as any).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleDisconnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(false) as Action);
        store.dispatch(hideAddSubscriptionModal() as Action);
        store.dispatch(hideEditSubscriptionModal() as Action);
        store.dispatch(hideShareRecordModal() as Action);
        store.dispatch(hideCommentModal() as Action);
        store.dispatch(hideUpdateStateModal() as Action);
    };
}

export function handleOpenAddSubscriptionModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(showAddSubcriptionModal() as Action);
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
        store.dispatch(showEditSubcriptionModal(subscriptionData) as Action);
    };
}

export function handleSubscriptionDeleted(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        // TODO: Fix the type of state below by importing the GlobalState from mattermost-webapp
        const {rhsState, pluggableId} = (store.getState() as any).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleOpenShareRecordModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(showShareRecordModal() as Action);
    };
}

export function handleOpenCommentModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const commentModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(showCommentModal(commentModalData) as Action);
    };
}

export function handleOpenUpdateStateModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const updateStateModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(showUpdateStateModal(updateStateModalData) as Action);
    };
}
