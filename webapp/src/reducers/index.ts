import {combineReducers} from 'redux';

import services from 'src/services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import refetchReducer from './refetchState';
import openShareRecordModalReducer from './shareRecordModal';
import openCommentModalReducer from './commentModal';
import openUpdateStateModalReducer from './updateStateModal';
import connectedReducer from './connectedState';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openEditSubscriptionModalReducer,
    refetchReducer,
    openShareRecordModalReducer,
    openCommentModalReducer,
    openUpdateStateModalReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
