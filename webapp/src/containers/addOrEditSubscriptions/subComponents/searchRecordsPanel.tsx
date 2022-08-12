import React, {forwardRef, useEffect, useState} from 'react';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';
import {Link} from 'react-router-dom';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import AutoSuggest from 'components/AutoSuggest';
import SkeletonLoader from 'components/loader/skeleton';

import Constants from 'plugin_constants';

import Utils from 'utils';

import usePluginApi from 'hooks/usePluginApi';

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
    recordType: RecordType | null;
    setApiError: (error: string | null) => void;
    setApiResponseValid: (valid: boolean) => void;
    setShowModalLoader: (show: boolean) => void;
    recordId: string | null;
    setRecordId: (recordId: string | null) => void;
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
    recordType,
    setApiError,
    setApiResponseValid,
    setRecordId,
}: SearchRecordsPanelProps, searchRecordPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);
    const [validationMsg, setValidationMsg] = useState<null | string>(null);
    const [debouncedGetSuggestions, setDebouncedGetSuggestions] =
    useState<(args: Record<string, string>) => void>();
    const {state: APIState, makeApiRequest, getApiState} = usePluginApi();
    const [searchRecordsPayload, setSearchRecordsPayload] = useState<SearchRecordsParams | null>(null);
    const charThresholdToShowSuggestions = 4;
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [getSuggestionDataPayload, setGetSuggestionDataPayload] = useState<GetRecordParams | null>(null);

    // Get record suggestions state
    const getRecordsSuggestions = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, searchRecordsPayload as SearchRecordsParams);
        return {isLoading, isSuccess, isError, data: data as Suggestion[], error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    // Get record data state
    const getRecordDataState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, getSuggestionDataPayload as GetRecordParams);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    // Get the suggestions from the API
    const getSuggestions = ({searchFor}: {searchFor?: string}) => {
        setApiError(null);
        if (recordType) {
            setSearchRecordsPayload({recordType, search: searchFor || ''});
            makeApiRequest(Constants.pluginApiServiceConfigs.searchRecords.apiServiceName, {recordType, search: searchFor || ''});
        } else {
            setSearchRecordsPayload(null);
        }
    };

    // Handles making API request for fetching the data for the selected record
    const getSuggestionData = (suggestionId: string) => {
        if (recordType) {
            setGetSuggestionDataPayload({recordType, recordId: suggestionId});
            makeApiRequest(Constants.pluginApiServiceConfigs.getRecord.apiServiceName, {recordType, recordId: suggestionId});
        }
    };

    // Initialize the debounced getSuggestion function
    useEffect(() => {
        setDebouncedGetSuggestions(() => Utils.debounce(getSuggestions, 500));
    }, [recordType]);

    // Handle API state updates in the suggestions
    useEffect(() => {
        const searchSuggestionsState = getRecordsSuggestions();
        if (searchSuggestionsState.isLoading) {
            setApiResponseValid(true);
        }
        if (searchSuggestionsState.isError) {
            setApiError(searchSuggestionsState.error);
        }
        if (searchSuggestionsState.data) {
            setSuggestions(searchSuggestionsState.data);
        }
    }, [APIState]);

    // Hide error state once the value is valid
    useEffect(() => {
        setValidationFailed(false);
        setValidationMsg(null);
    }, [recordValue]);

    // handle input value change
    const handleInputChange = (currentValue: string) => {
        setRecordValue(currentValue);
        setSuggestionChosen(false);
        setRecordId(null);
        if (currentValue) {
            if (debouncedGetSuggestions && currentValue.length >= charThresholdToShowSuggestions) {
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
    const getInputValue = (suggestion: Record<string, string>) => `${suggestion.number}: ${suggestion.short_description}`;

    // Handles action when an suggestion is chosen
    const handleSuggestionClick = (suggestionValue: Record<string, string>) => {
        setSuggestionChosen(true);
        setRecordValue(getInputValue(suggestionValue));
        setRecordId(suggestionValue.sys_id);
        getSuggestionData(suggestionValue.sys_id);
    };

    // Returns value for record data header
    const getRecordValueForHeader = (key: RecordDataKeys): string | JSX.Element | null => {
        const value = getRecordDataState().data?.[key];

        if (!value) {
            return null;
        } else if (typeof value === 'string') {
            return value;
        } else if (value?.display_value && value?.link) {
            return (
                <Link
                    to={value.link}
                    target='_blank'
                    className='btn btn-link'
                >
                    {value.display_value}
                </Link>
            );
        } else if (value?.display_value) {
            return value.display_value;
        }

        return null;
    };

    return (
        <div
            className={`modal__body modal-body search-panel secondary-panel ${className}`}
            ref={searchRecordPanelRef}
        >
            <AutoSuggest
                inputValue={recordValue}
                onInputValueChange={handleInputChange}
                onOptionClick={handleSuggestionClick}
                placeholder='Search Records'
                suggestionConfig={{
                    suggestions,
                    renderValue: getInputValue,
                }}
                charThresholdToShowSuggestions={charThresholdToShowSuggestions}
                error={validationMsg || validationFailed}
                className='search-panel__auto-suggest'
                loadingSuggestions={getRecordsSuggestions().isLoading}
            />
            {suggestionChosen && <ul className='search-panel__description'>
                {
                    Constants.RecordDataLabelConfig.map((header) => (
                        <li
                            key={header.key}
                            className='d-flex align-items-center search-panel__description-item'
                        >
                            <span className='search-panel__description-header text-ellipsis'>{header.label}</span>
                            <span className='search-panel__description-text text-ellipsis'>{getRecordDataState().isLoading ? <SkeletonLoader/> : getRecordValueForHeader(header.key) || 'N/A'}</span>
                        </li>
                    ))
                }
            </ul>}
            <ModalSubTitleAndError error={error}/>
            <ModalFooter
                onHide={onBack}
                onConfirm={handleContinue}
                cancelBtnText='Back'
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
                cancelDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default SearchRecordsPanel;