import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {ModalSubtitleAndError, ModalFooter, AutoSuggest} from 'mattermost-ui-library';

import Constants from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';
import {getRequiredChannelName} from 'utils';

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
    editing?: boolean;
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
    editing = false,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [channelSuggestions, setChannelSuggestions] = useState<Record<string, string>[]>([]);
    const [channelAutoSuggestValue, setChannelAutoSuggestValue] = useState(channel ?? '');
    const [validationFailed, setValidationFailed] = useState(false);
    const {makeApiRequest, getApiState} = usePluginApi();
    const {entities} = useSelector((state: GlobalState) => state);
    const [autoSuggestDefaultValue, setAutoSuggestDefaultValue] = useState<Record<string, string>>();

    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelData[], error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message};
    };

    const mapChannelsToSuggestions = useCallback((channels: ChannelData[]): Array<Record<string, string>> => channels.map((ch) => ({
        channelName: ch.display_name,
        channelType: ch.type,
        channelID: ch.id,
    })), []);

    // Set the suggestions when the input value of the auto-suggest changes;
    useEffect(() => {
        const channelsToSuggest = getChannelState().data?.filter((ch) => ch.display_name.toLowerCase().includes(channelAutoSuggestValue.toLowerCase())) || [];
        setChannelSuggestions(mapChannelsToSuggestions(channelsToSuggest));
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
            if (channel) {
                setChannelAutoSuggestValue(getRequiredChannelName(channel, channelListState.data));
            }

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

    // Provide the default value when subscription is being edited
    useEffect(() => {
        if (editing && getChannelState().isSuccess) {
            setAutoSuggestDefaultValue(mapChannelsToSuggestions(getChannelState()?.data?.filter((ch) => ch.id === channel) as unknown as ChannelData[])?.[0]);
        }
    }, [editing, getChannelState().isSuccess]);

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
    const handleChannelSelection = (channelSuggestion: Record<string, string> | null) => {
        setChannelAutoSuggestValue(channelSuggestion?.channelName || '');
        setChannel(channelSuggestion?.channelID || null);
    };

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
                    error={validationFailed && Constants.RequiredMsg}
                    disabled={getChannelState().isLoading}
                    loadingSuggestions={getChannelState().isLoading}
                    charThresholdToShowSuggestions={Constants.CharThresholdToSuggestChannel}
                    defaultValue={autoSuggestDefaultValue}
                />
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
