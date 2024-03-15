import React, {forwardRef, useCallback, useEffect, useState} from 'react';

import {ModalSubtitleAndError, ModalFooter, AutoSuggest, SkeletonLoader} from '@brightscout/mattermost-ui-library';

import Constants, {RecordType} from 'src/plugin_constants';

import Utils, {getLinkData, validateKeysContainingLink} from 'src/utils';

import usePluginApi from 'src/hooks/usePluginApi';

type SearchRecordsPanelProps = {
    className?: string;
    error?: string;
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
    setApiResponseValid?: (valid: boolean) => void;
    setShowModalLoader: (show: boolean) => void;
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
    error,
    recordValue,
    setRecordValue,
    suggestionChosen,
    setSuggestionChosen,
    setRecordData,
    recordType,
    setApiError,
    setApiResponseValid,
    setRecordId,
    recordId,
    resetStates,
    setResetStates,
    showFooter = false,
    disabled = false,
}: SearchRecordsPanelProps, searchRecordPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);
    const [validationMsg, setValidationMsg] = useState<null | string>(null);
    const {makeApiRequest, getApiState} = usePluginApi();
    const [searchRecordsPayload, setSearchRecordsPayload] = useState<SearchRecordsParams | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [getSuggestionDataPayload, setGetSuggestionDataPayload] = useState<GetRecordParams | null>(null);
    const [disabledInput, setDisabledInput] = useState(false);

    const getRecordsSuggestions = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, searchRecordsPayload as SearchRecordsParams);
        return {isLoading, isSuccess, isError, data: data as Suggestion[], error: apiErr};
    };

    const getRecordDataState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, getSuggestionDataPayload as GetRecordParams);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: apiErr};
    };

    // Get the suggestions from the API
    const getSuggestions = useCallback(({searchFor}: {searchFor?: string}) => {
        setApiError(null);
        if (recordType) {
            setSearchRecordsPayload({recordType, search: searchFor || ''});
            makeApiRequest(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, {recordType, search: searchFor || ''});
        } else {
            setSearchRecordsPayload(null);
        }
    }, [recordType]);

    // Handles making API request for fetching the data for the selected record
    const getSuggestionData = (suggestionId: string) => {
        if (recordType) {
            setGetSuggestionDataPayload({recordType, recordId: suggestionId});
            makeApiRequest(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, {recordType, recordId: suggestionId});
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

    // Set the default "inputValue" when the subscription is being edited
    useEffect(() => {
        const recordDataState = getRecordDataState();
        if (setRecordData) {
            setRecordData(recordDataState.data);
        }

        if (recordId && !recordValue) {
            if (recordDataState.data) {
                setRecordValue(`${recordDataState.data.number}: ${recordDataState.data.short_description}`);
                setDisabledInput(false);
            }
        }
    }, [getRecordDataState().isSuccess]);

    // Handle API state updates in the suggestions
    useEffect(() => {
        const searchSuggestionsState = getRecordsSuggestions();
        if (searchSuggestionsState.isLoading && setApiResponseValid) {
            setApiResponseValid(true);
        }
        if (searchSuggestionsState.isError && searchSuggestionsState.error) {
            setApiError(searchSuggestionsState.error);
        }
        if (searchSuggestionsState.data) {
            setSuggestions(searchSuggestionsState.data);
        }
    }, [getRecordsSuggestions().isLoading, getRecordsSuggestions().isError, getRecordsSuggestions().isSuccess]);

    // Handle API state updates while fetching record data
    useEffect(() => {
        const recordDataState = getRecordDataState();
        if (recordDataState.isLoading && setApiResponseValid) {
            setApiResponseValid(true);
        }
        if (recordDataState.isError && recordDataState.error) {
            setApiError(recordDataState.error);
        }
    }, [getRecordDataState().isLoading, getRecordDataState().isError]);

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
                    loadingSuggestions={getRecordsSuggestions().isLoading || (getRecordDataState().isLoading && disabledInput)}
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
                                    <span className='search-panel__description-text channel-text wt-500 text-ellipsis'>{getRecordDataState().isLoading ? <SkeletonLoader/> : getRecordValueForHeader(header.key) || 'N/A'}</span>
                                </li>
                            ))
                        ) : (
                            Constants.RecordDataLabelConfig.map((header) => (
                                <li
                                    key={header.key}
                                    className='d-flex align-items-center search-panel__description-item margin-bottom-10'
                                >
                                    <span className='search-panel__description-header margin-right-10 text-ellipsis'>{header.label}</span>
                                    <span className='search-panel__description-text channel-text wt-500 text-ellipsis'>{getRecordDataState().isLoading ? <SkeletonLoader/> : getRecordValueForHeader(header.key) || 'N/A'}</span>
                                </li>
                            ))
                        )}
                    </ul>
                )}
                <ModalSubtitleAndError error={error}/>
            </div>
            {showFooter && (
                <ModalFooter
                    onHide={onBack}
                    onConfirm={handleContinue}
                    cancelBtnText='Back'
                    confirmBtnText='Continue'
                    confirmDisabled={actionBtnDisabled || getRecordDataState().isLoading}
                    cancelDisabled={actionBtnDisabled || getRecordDataState().isLoading}
                />
            )}
        </div>
    );
});

export default SearchRecordsPanel;
