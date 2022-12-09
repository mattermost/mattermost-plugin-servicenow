import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';

import {setApiRequestCompletionState} from 'src/reducers/apiRequest';

import services from 'src/services';

function usePluginApi() {
    const pluginState = useSelector((state: ReduxState) => state['plugins-mattermost-plugin-servicenow']);
    const dispatch = useDispatch();

    const makeApiRequest = async (apiServiceName: string, payload?: APIPayloadType): Promise<any> => {
        return dispatch(services.endpoints[apiServiceName].initiate(payload)); //TODO: add proper type here
    };

    const makeApiRequestWithCompletionStatus = async (serviceName: ApiServiceName, payload?: APIPayloadType) => {
        const apiRequest = await makeApiRequest(serviceName, payload);
        if (apiRequest) {
            dispatch(setApiRequestCompletionState(serviceName));
        }
    };

    const getApiState = useCallback((apiServiceName: string, body?: APIPayloadType) => {
        const {data, isError, isLoading, isSuccess, error, isUninitialized} = services.endpoints[apiServiceName].select(body as APIPayloadType)(pluginState);
        return {data, isError, isLoading, isSuccess, error, isUninitialized};
    }, [pluginState]);

    return {makeApiRequest, makeApiRequestWithCompletionStatus, getApiState, pluginState};
}

export default usePluginApi;
