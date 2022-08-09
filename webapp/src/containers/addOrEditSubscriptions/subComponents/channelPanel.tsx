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
}

const ChannelPanel = forwardRef<HTMLDivElement, ChannelPanelProps>(({
    className,
    error,
    onContinue,
    actionBtnDisabled,
    channel,
    setChannel,
    setShowModalLoader,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);
    const {state: APIState, makeApiRequest, getApiState} = usePluginApi();
    const {entities} = useSelector((state: GlobalState) => state);

    // Get channelList state
    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelList[], error: ((apiErr as FetchBaseQueryError)?.data as {error?: string})?.error};
    };

    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});

        // Disabling the react-hooks/exhaustive-deps rule at the next line because if we include "makeApiRequest" in the dependency array, the useEffect runs infinitely.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the channelList once it is fetched from the backend
    useEffect(() => {
        const channelListState = getChannelState();
        if (channelListState.data) {
            setChannelOptions(channelListState.data.map((ch) => ({label: <span><i className='fa fa-globe dropdown-option-icon'/>{ch.display_name}</span>, value: ch.id})));
        }

        setShowModalLoader(channelListState.isLoading);

        // Disabling the react-hooks/exhaustive-deps rule at the next line because if we include "getMmApiState" in the dependency array, the useEffect runs infinitely.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [APIState]);

    // Hide error state once it the value is valid
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