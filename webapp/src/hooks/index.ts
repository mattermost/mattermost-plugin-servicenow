// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Store, UnknownAction} from 'redux';

import {GlobalState} from '@mattermost/types/store';

export default class Hooks {
    store: Store<GlobalState, UnknownAction>;

    constructor(store: Store<GlobalState, UnknownAction>) {
        this.store = store;
    }
}
