import {useSelector, useDispatch} from 'react-redux';

import services from 'services';

function usePluginApi() {
    const state = useSelector((pluginState: PluginState) => pluginState);
    const dispatch = useDispatch();

    const makeApiRequest = (apiServiceName: string, payload?: void) => {
        dispatch(services.endpoints[apiServiceName].initiate(payload));
    };

    const getApiState = (apiServiceName: string, body?: void) => {
        const {data, isError, isLoading, isSuccess, error} = services.endpoints[apiServiceName].select(body)(state['plugins-mattermost-plugin-servicenow']);
        return {data, isError, isLoading, isSuccess, error};
    };

    return {makeApiRequest, getApiState, state};
}

export default usePluginApi;
