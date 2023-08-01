import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-webapp/types/store';
import {General as MMConstants} from 'mattermost-redux/constants';

import {ModalSubtitleAndError, ModalFooter, AutoSuggest} from '@brightscout/mattermost-ui-library';

import Constants from 'src/plugin_constants';

import usePluginApi from 'src/hooks/usePluginApi';

type ChannelPanelProps = {
    className?: string;
    error?: string;
    validationError?: boolean;
    onContinue?: () => void;
    actionBtnDisabled?: boolean;
    channel: string | null;
    setChannel: (value: string | null) => void;
    showModalLoader?: boolean;
    setApiError: (error: APIError | null) => void;
    setApiResponseValid?: (valid: boolean) => void;
    channelOptions: DropdownOptionType[],
    setChannelOptions: (channelOptions: DropdownOptionType[]) => void;
    editing?: boolean;
    showFooter? :boolean;
    placeholder?: string;
    required?: boolean;
}

const ChannelPanel = forwardRef<HTMLDivElement, ChannelPanelProps>(({
    className,
    error,
    validationError = false,
    onContinue,
    actionBtnDisabled,
    channel,
    setChannel,
    showModalLoader,
    setApiError,
    setApiResponseValid,
    setChannelOptions,
    editing = false,
    showFooter = false,
    placeholder,
    required = false,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [channelSuggestions, setChannelSuggestions] = useState<Record<string, string>[]>([]);
    const [channelAutoSuggestValue, setChannelAutoSuggestValue] = useState('');
    const [validationFailed, setValidationFailed] = useState(false);
    const {makeApiRequest, getApiState} = usePluginApi();
    const {entities} = useSelector((state: GlobalState) => state);
    const [autoSuggestDefaultValue, setAutoSuggestDefaultValue] = useState<Record<string, string>>();

    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelData[], error: apiErr};
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

        if (channelListState.isLoading && setApiResponseValid) {
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
            const channelValue = mapChannelsToSuggestions(getChannelState()?.data?.filter((ch) => ch.id === channel) as unknown as ChannelData[])?.[0];
            setAutoSuggestDefaultValue(channelValue);
            if (!channelValue) {
                setChannel(null);
            }
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
            className={className}
            ref={channelPanelRef}
        >
            <div className={`padding-h-12 ${showFooter ? 'padding-v-20 wizard__body-container' : 'padding-top-10'}`}>
                <AutoSuggest
                    placeholder={placeholder || 'Select Channel'}
                    inputValue={channelAutoSuggestValue}
                    onInputValueChange={setChannelAutoSuggestValue}
                    onChangeSelectedSuggestion={handleChannelSelection}
                    suggestionConfig={{
                        suggestions: channelSuggestions,
                        renderValue: (suggestion) => getChannelAutoSuggestOptionJSX(suggestion.channelName, suggestion.channelType),
                    }}
                    required={required}
                    error={(validationFailed || validationError) && Constants.RequiredMsg}
                    disabled={getChannelState().isLoading || showModalLoader}
                    loadingSuggestions={getChannelState().isLoading}
                    charThresholdToShowSuggestions={Constants.CharThresholdToSuggestChannel}
                    defaultValue={autoSuggestDefaultValue}
                />
                <ModalSubtitleAndError error={error}/>
            </div>
            {showFooter && (
                <ModalFooter
                    onConfirm={handleContinue}
                    confirmBtnText='Continue'
                    confirmDisabled={actionBtnDisabled}
                />)}
        </div>
    );
});

export default ChannelPanel;
