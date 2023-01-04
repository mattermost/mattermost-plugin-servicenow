import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-webapp/types/store';
import {General as MMConstants} from 'mattermost-redux/constants';

import {ModalFooter, AutoSuggest} from '@brightscout/mattermost-ui-library';

import Constants from 'src/plugin_constants';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';

type ChannelPanelProps = {
    className?: string;
    validationError?: boolean;
    onContinue?: () => void;
    actionBtnDisabled?: boolean;
    channel: string | null;
    setChannel: (value: string | null) => void;
    showModalLoader?: boolean;
    setApiError: (error: APIError | null) => void;
    channelOptions: DropdownOptionType[],
    setChannelOptions: (channelOptions: DropdownOptionType[]) => void;
    editing?: boolean;
    showFooter? :boolean;
    placeholder?: string;
    required?: boolean;
}

const ChannelPanel = forwardRef<HTMLDivElement, ChannelPanelProps>(({
    className,
    validationError = false,
    onContinue,
    actionBtnDisabled,
    channel,
    setChannel,
    showModalLoader,
    setApiError,
    setChannelOptions,
    editing = false,
    showFooter = false,
    placeholder,
    required = false,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [channelSuggestions, setChannelSuggestions] = useState<Record<string, string>[]>([]);
    const [channelAutoSuggestValue, setChannelAutoSuggestValue] = useState('');
    const [validationFailed, setValidationFailed] = useState(false);
    const {makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();
    const [autoSuggestDefaultValue, setAutoSuggestDefaultValue] = useState<Record<string, string>>();
    const {currentTeamId} = useSelector((state: GlobalState) => state.entities.teams);

    const getChannelState = () => {
        const {isLoading, data, isSuccess} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
        return {isLoading, data: data as ChannelData[], isSuccess};
    };

    const mapChannelsToSuggestions = useCallback((channels: ChannelData[]): Array<Record<string, string>> => channels.map((ch) => ({
        channelName: ch.display_name,
        channelType: ch.type,
        channelID: ch.id,
    })), []);

    const {isLoading, data, isSuccess} = getChannelState();

    // Set the suggestions when the input value of the auto-suggest changes;
    useEffect(() => {
        const channelsToSuggest = data?.filter((ch) => ch.display_name.toLowerCase().includes(channelAutoSuggestValue.toLowerCase())) || [];
        setChannelSuggestions(mapChannelsToSuggestions(channelsToSuggest));
    }, [channelAutoSuggestValue, isSuccess]);

    useEffect(() => {
        setApiError(null);
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
    }, []);

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getChannels.apiServiceName,
        payload: {teamId: currentTeamId},
        handleSuccess: () => setChannelOptions(data.map((ch) => ({
            label: (
                <span>
                    <i className={`dropdown-option-icon ${ch.type === MMConstants.PRIVATE_CHANNEL ? 'icon icon-lock-outline' : 'icon icon-globe'}`}/>
                    {ch.display_name}
                </span>
            ),
            value: ch.id,
        }))),
        handleError: setApiError,
    });

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
        if (editing && isSuccess) {
            const channelValue = mapChannelsToSuggestions(data?.filter((ch) => ch.id === channel) as unknown as ChannelData[])?.[0];
            setAutoSuggestDefaultValue(channelValue);
            if (!channelValue) {
                setChannel(null);
            }
        }
    }, [editing, isSuccess]);

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
            <div className={`padding-h-12 ${showFooter && 'padding-v-20 wizard__body-container'}`}>
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
                    disabled={isLoading || showModalLoader}
                    loadingSuggestions={isLoading}
                    charThresholdToShowSuggestions={Constants.CharThresholdToSuggestChannel}
                    defaultValue={autoSuggestDefaultValue}
                />
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
