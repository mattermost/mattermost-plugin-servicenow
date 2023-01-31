import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-webapp/types/store';

import {setGlobalModalState} from 'src/reducers/globalModal';
import Constants, {ModalIds} from 'src/plugin_constants';
import Utils from 'src/utils';

export default class Hooks {
    store: Store<GlobalState, Action<Record<string, unknown>>>
    static slashCommandWillBePostedHook: (message: string, args: MmHookArgTypes) => Promise<({message?: string, args?: MmHookArgTypes})>;

    constructor(store: Store<GlobalState, Action<Record<string, unknown>>>) {
        this.store = store;
    }

    slashCommandWillBePostedHook = (message: string, contextArgs: MmHookArgTypes) => {
        let commandTrimmed;
        if (message) {
            commandTrimmed = message.trim();
        }

        if (commandTrimmed?.startsWith('/servicenow subscriptions add')) {
            this.store.dispatch(setGlobalModalState({modalId: ModalIds.ADD_SUBSCRIPTION}) as Action);
            return Promise.resolve({
                message,
                args: contextArgs,
            });
        }

        if (commandTrimmed?.startsWith('/servicenow subscriptions edit')) {
            const commandArgs = Utils.getCommandArgs(commandTrimmed);
            const regex = new RegExp(Constants.ServiceNowSysIdRegex);
            if (commandArgs.length >= 2 && regex.test(commandArgs[1])) {
                this.store.dispatch(setGlobalModalState({modalId: ModalIds.EDIT_SUBSCRIPTION, data: commandArgs[1]}) as Action);
            }

            return Promise.resolve({
                message,
                args: contextArgs,
            });
        }

        if (commandTrimmed?.startsWith('/servicenow records share')) {
            this.store.dispatch(setGlobalModalState({modalId: ModalIds.SHARE_RECORD}) as Action);
            return {
                message,
                args: contextArgs,
            };
        }

        if (commandTrimmed?.startsWith('/servicenow create incident')) {
            this.store.dispatch(setGlobalModalState({modalId: ModalIds.CREATE_INCIDENT}) as Action);
            return {
                message,
                args: contextArgs,
            };
        }

        if (commandTrimmed?.startsWith('/servicenow create request')) {
            this.store.dispatch(setGlobalModalState({modalId: ModalIds.CREATE_REQUEST}) as Action);
            return {
                message,
                args: contextArgs,
            };
        }

        return Promise.resolve({
            message,
            args: contextArgs,
        });
    }
}
