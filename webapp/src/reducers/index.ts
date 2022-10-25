import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openCommentModalReducer from './commentModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import refetchReducer from './refetchState';
import connectedReducer from './connectedState';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openCommentModalReducer,
    openEditSubscriptionModalReducer,
    refetchReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
