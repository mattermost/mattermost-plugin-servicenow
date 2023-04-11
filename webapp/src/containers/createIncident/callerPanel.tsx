import React, {useEffect, useState} from 'react';

import {AutoSuggest} from '@brightscout/mattermost-ui-library';

import Constants from 'src/plugin_constants';
import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';

type CallerPanelProps = {
    className?: string;
    caller: string | null;
    setCaller: (value: string | null) => void;
    senderId?: string;
    showModalLoader: boolean;
    setApiError: (apiError: APIError | null) => void;
    placeholder?: string;
}

const CallerPanel = (({
    className,
    caller,
    setCaller,
    senderId,
    showModalLoader,
    setApiError,
    placeholder,
}: CallerPanelProps): JSX.Element => {
    const [options, setOptions] = useState<CallerData[]>([]);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [autoSuggestValue, setAutoSuggestValue] = useState('');

    // usePluginApi hook
    const {makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();

    const mapCallersToSuggestions = (callers: CallerData[]): Array<Record<string, string>> => callers.map((c) => ({
        userId: c.serviceNowUser.sys_id,
        userName: c.username,
    }));

    const getUsersState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getUsers.apiServiceName);
        return {isLoading, data: data as CallerData[]};
    };

    // Set the callerID when any of the suggestion is selected
    const handleCallerSelection = (callerSuggestion: Record<string, string> | null) => {
        setAutoSuggestValue(callerSuggestion?.userName || '');
        setCaller(callerSuggestion?.userId || null);
    };

    // Set the suggestions when the input value of the auto-suggest changes
    useEffect(() => {
        const callersToSuggest = options?.filter((c) => c.username.toLowerCase().includes(autoSuggestValue.toLowerCase())) || [];
        setSuggestions(mapCallersToSuggestions(callersToSuggest));
    }, [autoSuggestValue, options]);

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getUsers.apiServiceName,
        handleSuccess: () => {
            setApiError(null);
            setOptions(data);
            if (senderId) {
                const senderDetails = data?.find((c) => c.mattermostUserID === senderId);
                if (senderDetails) {
                    handleCallerSelection({
                        userId: senderDetails.serviceNowUser.sys_id,
                        userName: senderDetails.username,
                    });
                }
            }
        },
        handleError: setApiError,
    });

    useEffect(() => {
        // Reset the caller auto-suggest input, if the caller value is reset.
        if (!caller) {
            setAutoSuggestValue('');
        }
    }, [caller]);

    // Make a request to fetch connected users
    useEffect(() => {
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getUsers.apiServiceName);
    }, []);

    const {isLoading, data} = getUsersState();
    return (
        <div className={`padding-h-12 padding-top-10 ${className}`}>
            <AutoSuggest
                placeholder={placeholder || 'Select caller'}
                inputValue={autoSuggestValue}
                onInputValueChange={setAutoSuggestValue}
                onChangeSelectedSuggestion={handleCallerSelection}
                disabled={isLoading || showModalLoader}
                loadingSuggestions={isLoading}
                suggestionConfig={{
                    suggestions,
                    renderValue: (suggestion) => suggestion.userName,
                }}
                charThresholdToShowSuggestions={Constants.CharThresholdToSuggestChannel}
            />
        </div>
    );
});

export default CallerPanel;
