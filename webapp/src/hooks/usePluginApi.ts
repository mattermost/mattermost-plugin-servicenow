import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import services from 'src/services';

function usePluginApi() {
    const pluginState = useSelector((state: ReduxState) => state['plugins-mattermost-plugin-servicenow']);
    const dispatch = useDispatch();

    const makeApiRequest = useCallback((apiServiceName: string, payload?: APIPayloadType) => {
        dispatch(services.endpoints[apiServiceName].initiate(payload as APIPayloadType));
    }, [dispatch]);

    const getApiState = useCallback((apiServiceName: string, body?: APIPayloadType) => {
        const {data, isError, isLoading, isSuccess, error} = services.endpoints[apiServiceName].select(body as APIPayloadType)(pluginState);
        return {data, isError, isLoading, isSuccess, error: (error as FetchBaseQueryError)?.data as APIError | undefined};
    }, [pluginState]);

    return {makeApiRequest, getApiState, pluginState};
}

export default usePluginApi;
