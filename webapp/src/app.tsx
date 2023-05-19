import Cookies from 'js-cookie';
import {GlobalState} from 'mattermost-webapp/types/store';
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';

const GetConfig = (): JSX.Element => {
    const {makeApiRequest, getApiState} = usePluginApi();
    const dispatch = useDispatch();

    const getConnectedUserState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);
        return {isLoading, data: data as ConnectedState};
    };

    const {entities} = useSelector((state: GlobalState) => state);
    Cookies.set('SiteUrl', entities.general.config.SiteURL as string);

    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
        makeApiRequest(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);
    }, []);

    useEffect(() => {
        const {data, isLoading} = getConnectedUserState();
        if (!isLoading && data) {
            dispatch(setConnected(data.connected));
        }
    }, [getConnectedUserState().isLoading, getConnectedUserState().data]);

    // This container is used just for making the API call for fetching the config, it doesn't render anything.
    return <></>;
};

export default GetConfig;
