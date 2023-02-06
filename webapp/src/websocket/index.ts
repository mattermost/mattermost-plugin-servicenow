import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-webapp/types/store';

import {ModalIds, SubscriptionEventsMap} from 'src/plugin_constants';
import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState, setGlobalModalState} from 'src/reducers/globalModal';
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

export function handleOpenAddSubscriptionModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalIds.ADD_SUBSCRIPTION}) as Action);
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
            filters: data.filters,
            userId: data.user_id,
            filtersData: data.filters_data as unknown as FiltersData[],
        };
        store.dispatch(setGlobalModalState({modalId: ModalIds.EDIT_SUBSCRIPTION, data: subscriptionData}) as Action);
    };
}

export function handleOpenShareRecordModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalIds.SHARE_RECORD}) as Action);
    };
}

export function handleOpenIncidentModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalIds.CREATE_INCIDENT}) as Action);
    };
}

export function handleOpenRequestModal(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setGlobalModalState({modalId: ModalIds.CREATE_REQUEST}) as Action);
    };
}
