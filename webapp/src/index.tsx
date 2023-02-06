import React from 'react';
import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-webapp/types/store';

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from 'src/types/mattermost-webapp';

import {ServiceNowIcon} from '@brightscout/mattermost-ui-library';

import reducer from 'src/reducers';
import Rhs from 'src/containers/Rhs';
import AddOrViewComments from 'src/containers/addOrViewComments';
import AddSubscription from 'src/containers/addOrEditSubscriptions/addSubscription';
import EditSubscription from 'src/containers/addOrEditSubscriptions/editSubscription';
import CreateIncident from 'src/containers/createIncident';
import CreateRequest from 'src/containers/createRequest';
import CreateIncidentPostMenuAction from 'src/containers/createIncident/createIncidentMenu';
import ShareRecords from 'src/containers/shareRecords';
import ServiceNowPost from 'src/containers/custom_post/sericeNowPost';
import UpdateState from 'src/containers/updateState';

import Constants from 'src/plugin_constants';

import DownloadButton from 'src/components/admin_settings/download_button';
import {handleConnect, handleDisconnect, handleSubscriptionDeleted, handleOpenEditSubscriptionModal, handleOpenShareRecordModal, handleOpenIncidentModal, handleOpenAddSubscriptionModal, handleOpenRequestModal} from 'src/websocket';
import Utils from 'src/utils';

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
        registry.registerRootComponent(AddOrViewComments);
        registry.registerRootComponent(CreateIncident);
        registry.registerRootComponent(ShareRecords);
        registry.registerRootComponent(UpdateState);
        registry.registerRootComponent(CreateRequest);
        registry.registerRootComponent(App);
        const {id, toggleRHSPlugin} = registry.registerRightHandSidebarComponent(Rhs, Constants.RightSidebarHeader);
        registry.registerChannelHeaderButtonAction(<ServiceNowIcon className='servicenow-icon'/>, () => store.dispatch(toggleRHSPlugin), null, Constants.ChannelHeaderTooltipText);
        registry.registerAdminConsoleCustomSetting('ServiceNowUpdateSetDownload', DownloadButton);
        const iconUrl = `${Utils.getBaseUrls().publicFilesUrl}${Constants.SERVICENOW_ICON_URL}`;
        if (registry.registerAppBarComponent) {
            registry.registerAppBarComponent(iconUrl, () => store.dispatch(toggleRHSPlugin), Constants.ChannelHeaderTooltipText);
        }

        registry.registerPostDropdownMenuComponent(CreateIncidentPostMenuAction);

        registry.registerWebSocketEventHandler(`custom_${manifest.id}_connect`, handleConnect(store, id));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_disconnect`, handleDisconnect(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_add_subscription`, handleOpenAddSubscriptionModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_edit_subscription`, handleOpenEditSubscriptionModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_subscription_deleted`, handleSubscriptionDeleted(store, id));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_search_and_share_record`, handleOpenShareRecordModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_create_incident`, handleOpenIncidentModal(store));
        registry.registerWebSocketEventHandler(`custom_${manifest.id}_create_request`, handleOpenRequestModal(store));

        registry.registerPostTypeComponent('custom_sn_share', ServiceNowPost);
        registry.registerPostTypeComponent('custom_sn_notification', ServiceNowPost);
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: Plugin): void
        PostUtils: {
            formatText(text: string, options?: FormatTextOptions): string,
            messageHtmlToComponent(html: string, isRHS: boolean, option?: MessageHtmlToComponentOptions): React.ReactNode,
        }
    }
}

window.registerPlugin(manifest.id, new Plugin());
