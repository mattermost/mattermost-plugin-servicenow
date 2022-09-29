import React from 'react';
import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from 'types/mattermost-webapp';

import {ServiceNowIcon} from '@brightscout/mattermost-ui-library';

import reducer from 'reducers';

import Rhs from 'containers/Rhs';
import AddSubscription from 'containers/addOrEditSubscriptions/addSubscription';
import EditSubscription from 'containers/addOrEditSubscriptions/editSubscription';

import Constants from 'plugin_constants';

import DownloadButton from 'components/admin_settings/download_button';
import {handleConnect, handleDisconnect, handleOpenAddSubscriptionModal, handleOpenEditSubscriptionModal, handleSubscriptionDeleted} from 'websocket';

import App from './app';

import manifest from './manifest';

import './styles/main.scss';

export default class Plugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public async initialize(registry: PluginRegistry, store: Store<GlobalState, Action<Record<string, unknown>>>) {
        // @see https://developers.mattermost.com/extend/plugins/webapp/reference/
        registry.registerReducer(reducer);
        registry.registerRootComponent(AddSubscription);
        registry.registerRootComponent(EditSubscription);
        registry.registerRootComponent(App);
        const {id, toggleRHSPlugin} = registry.registerRightHandSidebarComponent(Rhs, Constants.RightSidebarHeader);
        registry.registerChannelHeaderButtonAction(<ServiceNowIcon/>, () => store.dispatch(toggleRHSPlugin), null, Constants.ChannelHeaderTooltipText);
        registry.registerAdminConsoleCustomSetting('ServiceNowUpdateSetDownload', DownloadButton);

        registry.registerWebSocketEventHandler(`custom_${manifest.id}_connect`, handleConnect(store, id));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_disconnect`, handleDisconnect(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_add_subscription`, handleOpenAddSubscriptionModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_edit_subscription`, handleOpenEditSubscriptionModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_subscription_deleted`, handleSubscriptionDeleted(store, id));
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin());
