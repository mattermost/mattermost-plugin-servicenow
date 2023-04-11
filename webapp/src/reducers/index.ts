import {combineReducers} from 'redux';

import services from 'src/services';

import apiRequestCompletionReducer from './apiRequest';
import globalModalReducer from './globalModal';
import refetchReducer from './refetchState';
import connectedReducer from './connectedState';

export default combineReducers({
    apiRequestCompletionReducer,
    globalModalReducer,
    refetchReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
