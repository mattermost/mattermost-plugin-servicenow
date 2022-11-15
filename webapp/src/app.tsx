import React, {useEffect} from 'react';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

const GetConfig = (): JSX.Element => {
    const {makeApiRequest} = usePluginApi();

    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
    }, []);

    // This container is used just for making the API call for fetching the config, it doesn't render anything.
    return <></>;
};

export default GetConfig;
