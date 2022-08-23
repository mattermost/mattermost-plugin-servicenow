import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';
import refetchSubscriptionsReducer from './refetchSubscriptions';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openEditSubscriptionModalReducer,
    refetchSubscriptionsReducer,
    [services.reducerPath]: services.reducer,
});
