import {Store, Action} from 'redux';
import {GlobalState} from 'mattermost-redux/types/store';

import Constants from 'plugin_constants';

import {setConnected} from 'reducers/connectedState';
import {refetch} from 'reducers/refetchSubscriptions';
import {showModal as showAddSubcriptionModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditSubcriptionModal} from 'reducers/editSubscriptionModal';

export function handleConnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: WebsocketEventParams) => {
        store.dispatch(setConnected(true) as Action);
        store.dispatch(refetch() as Action);
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
        const subscriptionData: EditSubscriptionData = {
            channel: data.channel_id,
            recordId: data.record_id,
            id: data.sys_id,
            alertType: data.record_type as RecordType,
            stateChanged: data.subscription_events.includes(Constants.SubscriptionEvents.state),
            priorityChanged: data.subscription_events.includes(Constants.SubscriptionEvents.priority),
            newCommentChecked: data.subscription_events.includes(Constants.SubscriptionEvents.commented),
            assignedToChecked: data.subscription_events.includes(Constants.SubscriptionEvents.assignedTo),
            assignmentGroupChecked: data.subscription_events.includes(Constants.SubscriptionEvents.assignmentGroup),
        };
        store.dispatch(showEditSubcriptionModal(subscriptionData) as Action);
    };
}
