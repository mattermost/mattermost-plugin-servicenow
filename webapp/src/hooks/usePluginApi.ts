import {useSelector, useDispatch} from 'react-redux';

import services from 'services';

function usePluginApi() {
    const pluginState = useSelector((state: PluginState) => state['plugins-mattermost-plugin-servicenow']);
    const dispatch = useDispatch();

    const makeApiRequest = (apiServiceName: string, payload?: APIPayloadType) => {
        dispatch(services.endpoints[apiServiceName].initiate(payload as APIPayloadType));
    };

    const getApiState = (apiServiceName: string, body?: APIPayloadType) => {
        const {data, isError, isLoading, isSuccess, error} = services.endpoints[apiServiceName].select(body as APIPayloadType)(pluginState);
        return {data, isError, isLoading, isSuccess, error};
    };

    return {makeApiRequest, getApiState, pluginState};
}

export default usePluginApi;
