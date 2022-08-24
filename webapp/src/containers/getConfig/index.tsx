import React, {useEffect} from 'react';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

const GetConfig = (): JSX.Element => {
    const {makeApiRequest} = usePluginApi();

    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
    }, []);

    return <></>;
};

export default GetConfig;
