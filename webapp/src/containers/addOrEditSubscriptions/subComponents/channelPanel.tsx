import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {ModalSubtitleAndError, ModalFooter, AutoSuggest} from 'mm-ui-library';

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
    setChannelOptions,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [channelSuggestions, setChannelSuggestions] = useState<Record<string, string>[]>([]);
    const [channelAutoSuggestValue, setChannelAutoSuggestValue] = useState('');
    const [validationFailed, setValidationFailed] = useState(false);
    const {makeApiRequest, getApiState} = usePluginApi();
    const {entities} = useSelector((state: GlobalState) => state);

    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelData[], error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message};
    };

    // Set the suggestions when the input value of the auto-suggest changes;
    useEffect(() => {
        const channelsToSuggest = getChannelState().data?.filter((ch) => ch.display_name.toLowerCase().startsWith(channelAutoSuggestValue.toLowerCase())) || [];
        setChannelSuggestions([
            ...channelsToSuggest.map((ch) => ({
                channelName: ch.display_name,
                channelType: ch.type,
                channelID: ch.id,
            })),
        ]);
    }, [channelAutoSuggestValue, getChannelState().isSuccess]);

    useEffect(() => {
        setApiError(null);
        makeApiRequest(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
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
                        <i className={`dropdown-option-icon ${ch.type === MMConstants.PRIVATE_CHANNEL ? 'icon icon-lock-outline' : 'icon icon-globe'}`}/>
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

        // When the channel value is reset, reset the channel auto-suggest input as well;
        if (!channel) {
            setChannelAutoSuggestValue('');
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

    // Returns the JSX that should be rendered when the options are shown
    const getChannelAutoSuggestOptionJSX = useCallback((channelName: string, channelType: string) => (
        <span>
            <i className={`dropdown-option-icon ${channelType === MMConstants.PRIVATE_CHANNEL ? 'icon icon-lock-outline' : 'icon icon-globe'}`}/>
            {channelName}
        </span>
    ), []);

    // Set the channelID when any of the suggestion is selected
    const handleChannelSelection = (channelSuggestion: Record<string, string> | null) => setChannel(channelSuggestion?.channelID || null);

    return (
        <div
            className={`modal__body channel-panel wizard__primary-panel ${className}`}
            ref={channelPanelRef}
        >
            <div className='padding-h-12 padding-v-20 wizard__body-container'>
                <AutoSuggest
                    placeholder='Select Channel'
                    inputValue={channelAutoSuggestValue}
                    onInputValueChange={setChannelAutoSuggestValue}
                    onChangeSelectedSuggestion={handleChannelSelection}
                    suggestionConfig={{
                        suggestions: channelSuggestions,
                        renderValue: (suggestion) => getChannelAutoSuggestOptionJSX(suggestion.channelName, suggestion.channelType),
                    }}
                    required={true}
                    error={validationFailed && 'Required'}
                    disabled={getChannelState().isLoading}
                    loadingSuggestions={getChannelState().isLoading}
                />
                {/* <Dropdown
                    placeholder='Select Channel'
                    value={channel}
                    onChange={setChannel}
                    options={channelOptions}
                    required={true}
                    error={validationFailed && 'Required'}
                /> */}
                <ModalSubtitleAndError error={error}/>
            </div>
            <ModalFooter
                onConfirm={handleContinue}
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default ChannelPanel;
