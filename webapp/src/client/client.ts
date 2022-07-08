// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {id as pluginId} from '../manifest';

export default class Client {
    url = '';
    urlVersion = 'api/v1';

    setPluginBaseURL(url: string) {
        this.url = `${url}/plugins/${pluginId}/${this.urlVersion}`;
    }

    getPluginBaseURL(): string {
        return this.url;
    }
}
