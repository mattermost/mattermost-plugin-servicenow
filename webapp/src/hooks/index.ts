// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Store, Action} from 'redux';

import {GlobalState} from '@mattermost/types/store';

export default class Hooks {
    store: Store<GlobalState, Action<Record<string, unknown>>>

    constructor(store: Store<GlobalState, Action<Record<string, unknown>>>) {
        this.store = store;
    }
}
