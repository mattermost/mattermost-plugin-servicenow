import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openCommentModalReducer from './commentModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import refetchReducer from './refetchState';
import openShareRecordModalReducer from './shareRecordModal';
import connectedReducer from './connectedState';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openCommentModalReducer,
    openEditSubscriptionModalReducer,
    refetchReducer,
    openShareRecordModalReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
