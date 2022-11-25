import React, {forwardRef, useEffect, useState} from 'react';
import {AutoSuggest} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import Constants from 'src/plugin_constants';
import usePluginApi from 'src/hooks/usePluginApi';

type CallerPanelProps = {
    className?: string;
    caller: string | null;
    setCaller: (value: string | null) => void;
    showModalLoader: boolean;
    setShowModalLoader: (showModalLoader: boolean) => void;
    setApiError: (apiError: APIError | null) => void;
    placeholder?: string;
}

const CallerPanel = forwardRef<HTMLDivElement, CallerPanelProps>(({
    className,
    caller,
    setCaller,
    showModalLoader,
    setShowModalLoader,
    setApiError,
    placeholder,
}: CallerPanelProps): JSX.Element => {
    const [options, setOptions] = useState<CallerData[]>([]);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [autoSuggestValue, setAutoSuggestValue] = useState('');

    // usePluginApi hook
    const {makeApiRequest, getApiState} = usePluginApi();

    const mapCallersToSuggestions = (callers: CallerData[]): Array<Record<string, string>> => callers.map((c) => ({
        userId: c.serviceNowUser.sys_id,
        userName: c.username,
    }));

    // Get users state
    const getUsers = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getUsers.apiServiceName);
        return {isLoading, isSuccess, isError, data: data as CallerData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
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

    useEffect(() => {
        const {isLoading, isError, isSuccess, error, data} = getUsers();
        if (isError && error) {
            setApiError(error);
        }

        if (isSuccess) {
            setApiError(null);
            setOptions(data);
        }

        setShowModalLoader(isLoading);
    }, [getUsers().isError, getUsers().isSuccess, getUsers().isLoading]);

    useEffect(() => {
        // When the caller value is reset, reset the caller auto-suggest input as well
        if (!caller) {
            setAutoSuggestValue('');
        }
    }, [caller]);

    // Make a request to fetch connected users
    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getUsers.apiServiceName);
    }, []);

    return (
        <div
            className={className}
        >
            <div className='padding-h-12 padding-top-10'>
                <AutoSuggest
                    placeholder={placeholder || 'Select caller'}
                    inputValue={autoSuggestValue}
                    onInputValueChange={setAutoSuggestValue}
                    onChangeSelectedSuggestion={handleCallerSelection}
                    disabled={getUsers().isLoading || showModalLoader}
                    suggestionConfig={{
                        suggestions,
                        renderValue: (suggestion) => suggestion.userName,
                    }}
                    charThresholdToShowSuggestions={Constants.CharThresholdToSuggestChannel}
                />
            </div>
        </div>
    );
});

export default CallerPanel;
