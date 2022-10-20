import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

import {SubscriptionEventsMap} from 'plugin_constants';

import {setConnected} from 'reducers/connectedState';
import {refetch} from 'reducers/refetchSubscriptions';
import {showModal as showAddSubcriptionModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditSubcriptionModal} from 'reducers/editSubscriptionModal';
import {showModal as showShareRecordModal} from 'reducers/shareRecordModal';
import {showModal as showUpdateStateModal} from 'reducers/updateStateModal';

export function handleConnect(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(true) as Action);

        // Fix the type of state below by importing the GlobalState from mattermost-webapp
        const {rhsState, pluggableId} = (store.getState() as any).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleDisconnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(false) as Action);
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
        // Fix the type of state below by importing the GlobalState from mattermost-webapp
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

export function handleOpenUpdateStateModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(showUpdateStateModal() as Action);
    };
}
