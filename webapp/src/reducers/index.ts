import {combineReducers} from 'redux';

import services from 'src/services';

import currentModalReducer from './currentModal';
import globalModalReducer from './globalModal';
import refetchReducer from './refetchState';
import connectedReducer from './connectedState';

export default combineReducers({
    currentModalReducer,
    globalModalReducer,
    refetchReducer,
    connectedReducer,
    [services.reducerPath]: services.reducer,
});
