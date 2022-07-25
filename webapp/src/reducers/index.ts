import {combineReducers} from 'redux';

import services from 'services';

export default combineReducers({
    [services.reducerPath]: services.reducer,
});
