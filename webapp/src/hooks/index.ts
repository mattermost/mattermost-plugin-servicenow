import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

export default class Hooks {
    store: Store<GlobalState, Action<Record<string, unknown>>>

    constructor(store: Store<GlobalState, Action<Record<string, unknown>>>) {
        this.store = store;
    }
}
