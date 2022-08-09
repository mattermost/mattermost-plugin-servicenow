import {Store, Action} from 'redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {setConnected} from 'reducers/connectedState';

export function handleConnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: any) => {
        store.dispatch(setConnected(true) as Action);
    };
}

export function handleDisconnect(store: Store<GlobalState, Action<Record<string, unknown>>>) {
    return (_: any) => {
        store.dispatch(setConnected(false) as Action);
    };
}
