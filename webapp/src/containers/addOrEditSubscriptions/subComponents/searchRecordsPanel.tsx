import React, {forwardRef, useCallback, useEffect, useState} from 'react';

import {ModalFooter, AutoSuggest, SkeletonLoader} from '@brightscout/mattermost-ui-library';

import Constants, {RecordType} from 'src/plugin_constants';

import Utils, {getLinkData, validateKeysContainingLink} from 'src/utils';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';

type SearchRecordsPanelProps = {
    className?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    recordValue: string;
    setRecordValue: (value: string) => void;
    suggestionChosen: boolean;
    setSuggestionChosen: (suggestion: boolean) => void;
    setRecordData?: (value: RecordData | null) => void;
    recordType: RecordType | null;
    setApiError: (error: APIError | null) => void;
    recordId: string | null;
    setRecordId: (recordId: string | null) => void;
    resetStates: boolean;
    setResetStates: (reset: boolean) => void;
    showFooter?: boolean;
    disabled?: boolean;
}

const SearchRecordsPanel = forwardRef<HTMLDivElement, SearchRecordsPanelProps>(({
    className,
    onBack,
    onContinue,
    actionBtnDisabled,
    recordValue,
    setRecordValue,
    suggestionChosen,
    setSuggestionChosen,
    setRecordData,
    recordType,
    setApiError,
    setRecordId,
    recordId,
    resetStates,
    setResetStates,
    showFooter = false,
    disabled = false,
}: SearchRecordsPanelProps, searchRecordPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);
    const [validationMsg, setValidationMsg] = useState<null | string>(null);
    const {makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();
    const [searchRecordsPayload, setSearchRecordsPayload] = useState<SearchRecordsParams | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [getSuggestionDataPayload, setGetSuggestionDataPayload] = useState<GetRecordParams | null>(null);
    const [disabledInput, setDisabledInput] = useState(false);

    const getRecordsSuggestions = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, searchRecordsPayload);
        return {isLoading, data: data as Suggestion[]};
    };

    const getRecordDataState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, getSuggestionDataPayload);
        return {isLoading, data: data as RecordData};
    };

    // Get the suggestions from the API
    const getSuggestions = useCallback(({searchFor}: {searchFor?: string}) => {
        setApiError(null);
        if (recordType) {
            setSearchRecordsPayload({recordType, search: searchFor || ''});
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, {recordType, search: searchFor || ''});
        } else {
            setSearchRecordsPayload(null);
        }
    }, [recordType]);

    // Handles making API request for fetching the data for the selected record
    const getSuggestionData = (suggestionId: string) => {
        if (recordType) {
            setGetSuggestionDataPayload({recordType, recordId: suggestionId});
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, {recordType, recordId: suggestionId});
        }
    };

    // Handles resetting the states
    const resetValues = useCallback(() => {
        setRecordValue('');
        setRecordId(null);
        setDisabledInput(false);
        setSuggestionChosen(false);
        setGetSuggestionDataPayload(null);
        setSearchRecordsPayload(null);
        setSuggestions([]);
    }, []);

    const debouncedGetSuggestions = useCallback(Utils.debounce(getSuggestions, 500), [getSuggestions]);

    // If "recordId" is provided when the component is mounted, then the subscription is being edited, hence fetch the record data from the API
    useEffect(() => {
        if (recordId && !recordValue) {
            setDisabledInput(true);
            setSuggestionChosen(true);
            getSuggestionData(recordId);
        }

        // Reset the state when the component is unmounted
        return resetValues;
    }, []);

    // If the "resetStates" is set, reset the data
    useEffect(() => {
        if (resetStates) {
            resetValues();

            // Set the resetState to "false" once we've reset the states
            setResetStates(false);
        }
    }, [resetStates]);

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.searchRecords.apiServiceName,
        payload: searchRecordsPayload,
        handleSuccess: () => setSuggestions(recordSuggestionsData),
        handleError: (error) => setApiError(error),
    });

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getRecord.apiServiceName,
        payload: getSuggestionDataPayload,
        handleSuccess: () => {
            if (setRecordData) {
                setRecordData(recordData);
            }

            if (recordId && !recordValue) {
                setRecordValue(`${recordData.number}: ${recordData.short_description}`);
                setDisabledInput(false);
            }
        },
        handleError: (error) => setApiError(error),
    });

    const {isLoading: recordSuggestionsLoading, data: recordSuggestionsData} = getRecordsSuggestions();
    const {isLoading: recordDataLoading, data: recordData} = getRecordDataState();

    // Hide error state once the value is valid
    useEffect(() => {
        setValidationFailed(false);
        setValidationMsg(null);
    }, [recordValue]);

    // handle input value change
    const handleInputChange = (currentValue: string) => {
        setRecordValue(currentValue);
        setRecordId(null);
        setSuggestionChosen(false);
        if (currentValue) {
            if (currentValue.length >= Constants.DefaultCharThresholdToShowSuggestions) {
                debouncedGetSuggestions({searchFor: currentValue});
            }
        }
    };

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!recordValue) {
            setValidationFailed(true);
            return;
        }

        if (!suggestionChosen) {
            setValidationFailed(true);
            setValidationMsg(Constants.InvalidAutoCompleteValueMsg);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    // Returns value to be rendered in the options dropdown and in the input
    const getInputValue = useCallback((suggestion: Record<string, string>) => `${suggestion.number}: ${suggestion.short_description}`, []);

    // Handles action when a suggestion is chosen or the chosen suggestion is reset
    const handleSuggestionClick = (suggestionValue: Record<string, string> | null) => {
        setSuggestionChosen(Boolean(suggestionValue));
        setRecordValue(suggestionValue ? getInputValue(suggestionValue) : '');
        setRecordId(suggestionValue?.sys_id || null);

        if (suggestionValue) {
            getSuggestionData(suggestionValue.sys_id);
        }
    };

    // Returns value for record data header
    const getRecordValueForHeader = (key: RecordDataKeys): string | JSX.Element | null => {
        const value = getRecordDataState().data?.[key];

        if (!value) {
            return null;
        } else if (typeof value === 'string') {
            if (value === Constants.EmptyFieldsInServiceNow || !validateKeysContainingLink(key)) {
                return value;
            }

            const data: LinkData = getLinkData(value);
            return (
                <a
                    href={data.link}
                    target='_blank'
                    rel='noreferrer'
                    className='btn btn-link padding-0'
                >
                    {data.display_value}
                </a>
            );
        }

        return null;
    };

    return (
        <div
            className={className}
            ref={searchRecordPanelRef}
        >
            <div className={`padding-h-12 ${showFooter ? 'padding-v-20 wizard__body-container' : 'padding-top-10'}`}>
                <AutoSuggest
                    inputValue={recordValue}
                    onInputValueChange={handleInputChange}
                    onChangeSelectedSuggestion={handleSuggestionClick}
                    placeholder='Search Records'
                    suggestionConfig={{
                        suggestions,
                        renderValue: getInputValue,
                    }}
                    required={true}
                    error={validationMsg || validationFailed}
                    className='search-panel__auto-suggest margin-bottom-30'
                    loadingSuggestions={recordSuggestionsLoading || (recordDataLoading && disabledInput)}
                    charThresholdToShowSuggestions={Constants.DefaultCharThresholdToShowSuggestions}
                    disabled={disabledInput || disabled}
                />
                {suggestionChosen && (
                    <ul className='search-panel__description margin-top-25 padding-left-15 font-14'>
                        {recordType === RecordType.KNOWLEDGE ? (
                            Constants.KnowledgeRecordDataLabelConfig.map((header) => (
                                <li
                                    key={header.key}
                                    className='d-flex align-items-center search-panel__description-item margin-bottom-10'
                                >
                                    <span className='search-panel__description-header margin-right-10 text-ellipsis'>{header.label}</span>
                                    <span className='search-panel__description-text channel-text wt-500 text-ellipsis'>{recordDataLoading ? <SkeletonLoader/> : getRecordValueForHeader(header.key) || 'N/A'}</span>
                                </li>
                            ))
                        ) : (
                            Constants.RecordDataLabelConfig.map((header) => (
                                <li
                                    key={header.key}
                                    className='d-flex align-items-center search-panel__description-item margin-bottom-10'
                                >
                                    <span className='search-panel__description-header margin-right-10 text-ellipsis'>{header.label}</span>
                                    <span className='search-panel__description-text channel-text wt-500 text-ellipsis'>{recordDataLoading ? <SkeletonLoader/> : getRecordValueForHeader(header.key) || 'N/A'}</span>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
            {showFooter && (
                <ModalFooter
                    onHide={onBack}
                    onConfirm={handleContinue}
                    cancelBtnText='Back'
                    confirmBtnText='Continue'
                    confirmDisabled={actionBtnDisabled || recordDataLoading}
                    cancelDisabled={actionBtnDisabled || recordDataLoading}
                />
            )}
        </div>
    );
});

export default SearchRecordsPanel;
