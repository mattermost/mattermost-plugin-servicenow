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
