import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-webapp/types/store';

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

export function handleSubscriptionDeleted(store: Store<GlobalState, Action<Record<string, unknown>>>, rhsComponentId: string) {
    return (_: WebsocketEventParams) => {
        const {rhsState, pluggableId} = (store.getState() as GlobalState).views.rhs;
        if (rhsState === 'plugin' && pluggableId === rhsComponentId) {
            store.dispatch(refetch() as Action);
        }
    };
}

export function handleOpenCommentModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const commentModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: 'addOrViewComments', data: commentModalData}) as Action);
    };
}

export function handleOpenUpdateStateModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (msg: WebsocketEventParams) => {
        const {data} = msg;
        const updateStateModalData: CommentAndStateModalData = {
            recordType: data.record_type as RecordType,
            recordId: data.record_id,
        };
        store.dispatch(setGlobalModalState({modalId: 'updateState', data: updateStateModalData}) as Action);
    };
}
