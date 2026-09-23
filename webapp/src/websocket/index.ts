// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Store, UnknownAction} from 'redux';

import {GlobalState} from 'src/types/common/globalState';

import {SubscriptionEventsMap} from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {setGlobalModalState, resetGlobalModalState} from 'src/reducers/globalModal';
import {refetch} from 'src/reducers/refetchState';

export function handleConnect(store: Store<GlobalState, UnknownAction>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(true));
        const globalState = (store.getState() as GlobalState);
        if (globalState.views?.rhs?.rhsState === 'plugin') {
            if (globalState.views.rhs.pluggableId === rhsComponentId) {
                store.dispatch(refetch());
            }
        } else {
            store.dispatch(refetch());
        }
    };
}

export function handleDisconnect(store: Store<GlobalState, UnknownAction>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(false));
        store.dispatch(resetGlobalModalState());
    };
}

export function handleOpenAddSubscriptionModal(store: Store<GlobalState, UnknownAction>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: 'addSubscription'}));
    };
}

export function handleOpenEditSubscriptionModal(store: Store<GlobalState, UnknownAction>) {
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
            userId: data.user_id,
        };
        store.dispatch(setGlobalModalState({modalId: 'editSubscription', data: subscriptionData}));
    };
}

export function handleSubscriptionDeleted(store: Store<GlobalState, UnknownAction>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        const globalState = (store.getState() as GlobalState);
        if (globalState.views?.rhs?.rhsState === 'plugin') {
            if (globalState.views.rhs.pluggableId === rhsComponentId) {
                store.dispatch(refetch());
            }
        } else {
            store.dispatch(refetch());
        }
    };
}

export function handleOpenShareRecordModal(store: Store<GlobalState, UnknownAction>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: 'shareRecord'}));
    };
}

export function handleOpenCommentModal(store: Store<GlobalState, UnknownAction>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const commentModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: 'addOrViewComments', data: commentModalData}));
    };
}

export function handleOpenUpdateStateModal(store: Store<GlobalState, UnknownAction>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const updateStateModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: 'updateState', data: updateStateModalData}));
    };
}

export function handleOpenIncidentModal(store: Store<GlobalState, UnknownAction>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: 'createIncident'}));
    };
}
