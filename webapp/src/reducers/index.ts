// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import services from 'src/services';

import globalModalReducer from './globalModal';
import refetchReducer from './refetchState';
import connectedReducer from './connectedState';

export default combineReducers({
    globalModalReducer,
    refetchReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
