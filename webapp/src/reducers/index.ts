import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import openUpdateStateModalReducer from './updateStateModal';
import refetchSubscriptionsReducer from './refetchSubscriptions';
import connectedReducer from './connectedState';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openEditSubscriptionModalReducer,
    openUpdateStateModalReducer,
    refetchSubscriptionsReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
