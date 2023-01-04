import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';
import {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {resetApiRequestCompletionState} from 'src/reducers/apiRequest';
import {getApiRequestCompletionState} from 'src/selectors';

import usePluginApi from './usePluginApi';

type Props = {
    handleSuccess?: () => void
    handleError?: (error: APIError) => void
    serviceName: ApiServiceName
    payload?: APIPayloadType
}

function useApiRequestCompletionState({handleSuccess, handleError, serviceName, payload}: Props) {
    const {getApiState, pluginState} = usePluginApi();
    const dispatch = useDispatch();

    // Observe for the change in redux state after API call and do the required actions
    useEffect(() => {
        if (
            getApiRequestCompletionState(pluginState).requests.includes(serviceName) &&
            getApiState(serviceName, payload)
        ) {
            const {isError, isSuccess, isUninitialized, error} = getApiState(serviceName, payload);
            const apiErr = (error as FetchBaseQueryError)?.data as APIError | undefined;
            if (isSuccess && !isError && handleSuccess) {
                handleSuccess();
            }

            if (!isSuccess && isError && apiErr && handleError) {
                handleError(apiErr);
            }

            if (!isUninitialized) {
                dispatch(resetApiRequestCompletionState(serviceName));
            }
        }
    }, [
        getApiRequestCompletionState(pluginState).requests.includes(serviceName),
        getApiState(serviceName, payload),
    ]);
}

export default useApiRequestCompletionState;
