import React, {forwardRef, useEffect, useState} from 'react';

import {AutoSuggest} from '@brightscout/mattermost-ui-library';

import Constants from 'src/plugin_constants';

// TODO: remove after integration with the APIs
const incidentCallerOptions: CallerData[] = [
    {
        mattermostUserID: 'user id 1',
        username: 'user 1',
        serviceNowUser: {
            sys_id: 'sys_id 1',
            email: 'user email',
            user_name: 'user 1',
        },
    },
    {
        mattermostUserID: 'user id 2',
        username: 'user 2',
        serviceNowUser: {
            sys_id: 'sys_id 2',
            email: 'user email',
            user_name: 'user 2',
        },
    },
    {
        mattermostUserID: 'caller id 1',
        username: 'caller 1',
        serviceNowUser: {
            sys_id: 'sys_id 3',
            email: 'caller email',
            user_name: 'caller 3',
        },
    },
    {
        mattermostUserID: 'caller id 4',
        username: 'caller 4',
        serviceNowUser: {
            sys_id: 'sys_id 4',
            email: 'caller email',
            user_name: 'caller 4',
        },
    },
];

type CallerPanelProps = {
    className?: string;
    actionBtnDisabled?: boolean;
    caller: string | null;
    setCaller: (value: string | null) => void;
    setShowModalLoader: (show: boolean) => void;
    placeholder?: string;
}

const CallerPanel = forwardRef<HTMLDivElement, CallerPanelProps>(({
    className,
    actionBtnDisabled,
    caller,
    setCaller,
    placeholder,
}: CallerPanelProps): JSX.Element => {
    const [options, setOptions] = useState<CallerData[]>(incidentCallerOptions);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [autoSuggestValue, setAutoSuggestValue] = useState('');

    const mapCallersToSuggestions = (callers: CallerData[]): Array<Record<string, string>> => callers.map((c) => ({
        userId: c.serviceNowUser.sys_id,
        userName: c.username,
    }));

    // Set the suggestions when the input value of the auto-suggest changes;
    useEffect(() => {
        const callersToSuggest = options?.filter((c) => c.username.toLowerCase().includes(autoSuggestValue.toLowerCase())) || [];
        setSuggestions(mapCallersToSuggestions(callersToSuggest));
    }, [autoSuggestValue]);

    // Set the callerID when any of the suggestion is selected
    const handleCallerSelection = (callerSuggestion: Record<string, string> | null) => {
        setAutoSuggestValue(callerSuggestion?.userName || '');
        setCaller(callerSuggestion?.userId || null);
    };

    useEffect(() => {
        // When the caller value is reset, reset the caller auto-suggest input as well;
        if (!caller) {
            setAutoSuggestValue('');
        }
    }, [caller]);

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
                    disabled={actionBtnDisabled}
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
