import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

import {showModal as showAddSubscriptionModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditSubscriptionModal} from 'reducers/editSubscriptionModal';

export default class Hooks {
    store: Store<GlobalState, Action<Record<string, unknown>>>

    constructor(store: Store<GlobalState, Action<Record<string, unknown>>>) {
        this.store = store;
    }

    slashCommandWillBePostedHook = (message: string, contextArgs: {channel_id: string, team_id: string, root_id: string}) => {
        if (message?.trim() === '/servicenow subscriptions add') {
            this.store.dispatch(showAddSubscriptionModal() as unknown as Action<Record<string, unknown>>);
            return Promise.resolve({});
        }

        if (message?.trim() === '/servicenow subscriptions edit') {
            this.store.dispatch(showEditSubscriptionModal() as unknown as Action<Record<string, unknown>>);
            return Promise.resolve({});
        }

        return Promise.resolve({
            message,
            args: contextArgs,
        });
    }
}
