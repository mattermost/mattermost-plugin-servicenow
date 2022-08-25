import React, {forwardRef, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Dropdown from 'components/dropdown';

import Constants from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';

type ChannelPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    actionBtnDisabled?: boolean;
    channel: string | null;
    setChannel: (value: string | null) => void;
    setShowModalLoader: (show: boolean) => void;
    setApiError: (error: string | null) => void;
    setApiResponseValid: (valid: boolean) => void;
    channelOptions: DropdownOptionType[],
    setChannelOptions: (channelOptions: DropdownOptionType[]) => void;
}

const ChannelPanel = forwardRef<HTMLDivElement, ChannelPanelProps>(({
    className,
    error,
    onContinue,
    actionBtnDisabled,
    channel,
    setChannel,
    setShowModalLoader,
    setApiError,
    setApiResponseValid,
    channelOptions,
    setChannelOptions,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);
    const {makeApiRequest, getApiState} = usePluginApi();
    const {entities} = useSelector((state: GlobalState) => state);

    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelData[], error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message};
    };

    useEffect(() => {
        setApiError(null);
        makeApiRequest(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});

        // Disabling the react-hooks/exhaustive-deps rule at the next line because if we include "makeApiRequest" in the dependency array, the useEffect runs infinitely.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the channelList once it is fetched from the backend
    useEffect(() => {
        const channelListState = getChannelState();

        if (channelListState.isLoading) {
            setApiResponseValid(true);
        }

        if (channelListState.data) {
            setChannelOptions(channelListState.data.map((ch) => ({
                label: (
                    <span>
                        <i className={`dropdown-option-icon ${ch.type === Constants.PrivateChannelType ? 'icon icon-lock-outline' : 'icon icon-globe'}`}/>
                        {ch.display_name}
                    </span>
                ),
                value: ch.id,
            })));
        }

        if (channelListState.error) {
            setApiError(channelListState.error);
        }
        setShowModalLoader(channelListState.isLoading);
    }, [getChannelState().isLoading, getChannelState().isError, getChannelState().isSuccess]);

    // Hide error state once the value is valid
    useEffect(() => {
        if (channel) {
            setValidationFailed(false);
        }
    }, [channel]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!channel) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    return (
        <div
            className={`modal__body modal-body channel-panel ${className}`}
            ref={channelPanelRef}
        >
            <Dropdown
                placeholder='Select Channel'
                value={channel}
                onChange={(newValue) => setChannel(newValue)}
                options={channelOptions}
                required={true}
                error={validationFailed && 'Required'}
                disabled={getChannelState().isLoading}
            />
            <ModalSubTitleAndError error={error}/>
            <ModalFooter
                onConfirm={handleContinue}
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default ChannelPanel;
