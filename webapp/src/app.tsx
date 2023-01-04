import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants, {ModalIds} from 'src/plugin_constants';

import {getGlobalModalState} from './selectors';
import {setConnected} from './reducers/connectedState';

const GetConfig = (): JSX.Element => {
    const {makeApiRequest, pluginState, getApiState, makeApiRequestWithCompletionStatus} = usePluginApi();
    const {modalId} = getGlobalModalState(pluginState);
    const dispatch = useDispatch();

    const getConnectedUserState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);
        return {isLoading, data: data as ConnectedState};
    };

    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
        makeApiRequest(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);
    }, []);

    useEffect(() => {
        if (modalId === ModalIds.ADD_SUBSCRIPTION || modalId === ModalIds.EDIT_SUBSCRIPTION) {
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.checkSubscriptionsConfigured.apiServiceName);
        }
    }, [modalId]);

    useEffect(() => {
        const {data, isLoading} = getConnectedUserState();
        if (!isLoading && data) {
            dispatch(setConnected(data.connected));
        }
    }, [getConnectedUserState().isLoading, getConnectedUserState().data]);

    // This container is used just for making the API calls, it doesn't render anything.
    return <></>;
};

export default GetConfig;
