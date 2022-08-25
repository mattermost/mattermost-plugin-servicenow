import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import refetchSubscriptionsReducer from './refetchSubscriptions';
import connectedReducer from './connectedState';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openEditSubscriptionModalReducer,
    refetchSubscriptionsReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
