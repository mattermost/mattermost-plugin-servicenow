import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {ToggleSwitch} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'src/hooks/usePluginApi';
import Constants from 'src/plugin_constants';

import {refetch} from 'src/reducers/refetchState';
import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import './styles.scss';

const SubscribeNewIncident = ({
    subscriptionPayload,
    channel, setChannel,
    showModalLoader,
    setShowModalLoader,
    setApiError,
    channelOptions,
    setChannelOptions,
    showChannelValidationError,
    handleError,
    setShowResultPanel,
    showChannelPanel,
    setShowChannelPanel}: any) => {
    // usePluginApi hook
    const {getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const getSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, subscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    useEffect(() => {
        if (subscriptionPayload) {
            const {isLoading, isError, isSuccess, error} = getSubscriptionState();
            setShowModalLoader(isLoading);
            if (isError && error) {
                handleError(error);
            }

            if (isSuccess) {
                setApiError(null);
                dispatch(refetch());
                setShowResultPanel(true);
            }
        }
    }, [getSubscriptionState().isError, getSubscriptionState().isSuccess, getSubscriptionState().isLoading]);

    return (
        <>
            <ToggleSwitch
                active={showChannelPanel}
                onChange={setShowChannelPanel}
                label={Constants.ChannelPanelToggleLabel}
                labelPositioning='right'
                className='incident-body__toggle-switch'
            />
            {showChannelPanel && (
                <ChannelPanel
                    channel={channel}
                    setChannel={setChannel}
                    showModalLoader={showModalLoader}
                    setApiError={setApiError}
                    channelOptions={channelOptions}
                    setChannelOptions={setChannelOptions}
                    actionBtnDisabled={showModalLoader}
                    editing={true}
                    validationError={showChannelValidationError}
                    required={true}
                    placeholder='Select channel to create subscription'
                    className={`incident-body__auto-suggest ${channel ? 'incident-body__suggestion-chosen' : ''}`}
                />
            )}
        </>
    );
};

export default SubscribeNewIncident;
