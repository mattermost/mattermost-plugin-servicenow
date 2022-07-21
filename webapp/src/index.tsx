import {Store, Action} from 'redux';

import {GlobalState} from 'mattermost-redux/types/store';

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from 'types/mattermost-webapp';

import DownloadButton from 'components/admin_settings/download_button';
import Client from 'client';
import {getServerRoute} from 'selectors';

import manifest from './manifest';

export default class Plugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public async initialize(registry: PluginRegistry, store: Store<GlobalState, Action<Record<string, unknown>>>) {
        Client.setPluginBaseURL(getServerRoute(store.getState()));

        // @see https://developers.mattermost.com/extend/plugins/webapp/reference/
        registry.registerAdminConsoleCustomSetting('ServiceNowUpdateSetDownload', DownloadButton);
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin());
