import React, {forwardRef, useEffect, useState} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import AutoSuggest from 'components/AutoSuggest';
import SkeletonLoader from 'components/loader/skeleton';

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
}

// Dummy data
const suggestions = ['Record 1', 'Record 2', 'Record 3', 'Record 4', 'Record 5'];

const SearchRecordsPanel = forwardRef<HTMLDivElement, SearchRecordsPanelProps>(({className, onBack, onContinue, actionBtnDisabled, error, recordValue, setRecordValue, suggestionChosen, setSuggestionChosen}: SearchRecordsPanelProps, searchRecordPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);

    const descriptionHeaders = ['Short Description', 'State', 'Priority', 'Assigned To', 'Assignment Group'];

    // Hide error state once the value is valid
    useEffect(() => {
        setValidationFailed(false);
    }, [recordValue]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!recordValue) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    // Handles action when an suggestion is chosen
    const handleSuggestionClick = (suggestionValue: string) => {
        setSuggestionChosen(true);
        setRecordValue(suggestionValue);
    };

    return (
        <div
            className={`modal__body modal-body search-panel secondary-panel ${className}`}
            ref={searchRecordPanelRef}
        >
            <AutoSuggest
                inputValue={recordValue}
                onInputValueChange={(newValue) => setRecordValue(newValue)}
                onOptionClick={handleSuggestionClick}
                placeholder='Search Records'
                suggestions={suggestions}
                charThresholdToShowSuggestions={4}
                error={validationFailed}
                className='search-panel__auto-suggest'
            />
            {suggestionChosen && <ul className='search-panel__description'>
                {
                    descriptionHeaders.map((header) => (
                        <li
                            key={header}
                            className='d-flex align-items-center search-panel__description-item'
                        >
                            <span className='search-panel__description-header text-ellipsis'>{header}</span>
                            <span className='search-panel__description-text text-ellipsis'><SkeletonLoader/></span>
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
