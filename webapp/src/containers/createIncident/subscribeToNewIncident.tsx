import React, {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {ToggleSwitch} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'src/hooks/usePluginApi';
import Constants from 'src/plugin_constants';

import {refetch} from 'src/reducers/refetchState';
import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import './styles.scss';

type PropTypes = {
    subscriptionPayload: CreateSubscriptionPayload | null;
    channel: string | null;
    setChannel : React.Dispatch<React.SetStateAction<string | null>>;
    showModalLoader: boolean;
    setShowModalLoader: React.Dispatch<React.SetStateAction<boolean>>;
    setApiError: React.Dispatch<React.SetStateAction<APIError | null>>;
    channelOptions: DropdownOptionType[];
    setChannelOptions: React.Dispatch<React.SetStateAction<DropdownOptionType[]>>;
    showChannelValidationError: boolean;
    handleError: (error: APIError) => void;
    setShowResultPanel: React.Dispatch<React.SetStateAction<boolean>>;
    showChannelPanel: boolean;
    setShowChannelPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const SubscribeNewIncident = ({
    subscriptionPayload,
    channel,
    setChannel,
    showModalLoader,
    setShowModalLoader,
    setApiError,
    channelOptions,
    setChannelOptions,
    showChannelValidationError,
    handleError,
    setShowResultPanel,
    showChannelPanel,
    setShowChannelPanel}: PropTypes) => {
    // usePluginApi hook
    const {getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const getSubscriptionState = () => {
        const {isLoading, isSuccess, isError, error} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, subscriptionPayload);
        return {isLoading, isSuccess, isError, error};
    };

    const {isLoading, isError, isSuccess, error} = getSubscriptionState();

    useEffect(() => {
        if (subscriptionPayload) {
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
    }, [subscriptionPayload, isLoading, isError, isSuccess]);

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
