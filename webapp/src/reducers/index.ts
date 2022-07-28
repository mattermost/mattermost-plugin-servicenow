import {combineReducers} from 'redux';

import services from 'services';

import openAddSubscriptionModalReducer from './addSubscriptionModal';
import openEditSubscriptionModalReducer from './editSubscriptionModal';

export default combineReducers({
    openAddSubscriptionModalReducer,
    openEditSubscriptionModalReducer,
    [services.reducerPath]: services.reducer,
});
