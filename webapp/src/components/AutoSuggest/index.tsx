import React, {useEffect, useState} from 'react';
import {clearTimeout} from 'timers';

import Constants from 'plugin_constants';

import './styles.scss';

type AutoSuggestProps = {
    inputValue: string;
    onInputValueChange: (newValue: string) => void;
    onOptionClick: (suggestion: Record<string, string>) => void;
    placeholder?: string;
    suggestionConfig: {
        suggestions: Record<string, string>[],
        renderValue: (suggestion: Record<string, string>) => string;
    };
    loadingSuggestions?: boolean;
    charThresholdToShowSuggestions?: number;
    disabled?: boolean;
    error?: boolean | string;
    required?: boolean;
    className?: string;
}

const AutoSuggest = ({
    inputValue,
    onInputValueChange,
    placeholder,
    suggestionConfig,
    loadingSuggestions = false,
    charThresholdToShowSuggestions = Constants.DefaultCharThresholdToShowSuggestions,
    disabled,
    error,
    required,
    className = '',
    onOptionClick,
}: AutoSuggestProps) => {
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    let inputBlurTimer: NodeJS.Timeout;

    const {suggestions, renderValue} = suggestionConfig;

    // Show suggestions depending on the input value, number of characters and whether the input is in focused state
    useEffect(() => {
        setOpen(inputValue.length >= charThresholdToShowSuggestions && focused);
    }, [charThresholdToShowSuggestions, focused, inputValue, loadingSuggestions]);

    const handleSuggestionClick = (suggestedValue: Record<string, string>) => {
        onOptionClick(suggestedValue);
        setOpen(false);
    };

    useEffect(() => {
        return () => {
            clearTimeout(inputBlurTimer);
        };
    }, []);

    const handleBlur = () => {
        // Hide focused state
        inputBlurTimer = setTimeout(() => {
            setFocused(false);
        }, 200);
    };

    return (
        <div className={`auto-suggest ${disabled && 'auto-suggest--disabled'} ${error && 'auto-suggest--error'} ${className}`}>
            <div className={`auto-suggest__field cursor-pointer d-flex align-items-center justify-content-between ${focused && 'auto-suggest__field--focused'}`}>
                <input
                    placeholder={`${placeholder ?? ''}${required ? '*' : ''}`}
                    value={inputValue}
                    onChange={(e) => onInputValueChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={handleBlur}
                    className='auto-suggest__input'
                    disabled={disabled}
                />
                {loadingSuggestions ? (
                    <div className='auto-suggest__loader'/>
                ) : (
                    <i className={`fa fa-angle-down auto-suggest__field-angle ${open && 'auto-suggest__field-angle--rotated'}`}/>
                )}
            </div>
            {inputValue.length < charThresholdToShowSuggestions && focused && <p className='auto-suggest__get-suggestion-warn'>{`Please enter at least ${charThresholdToShowSuggestions} characters to get suggestions.`}</p>}
            <ul className={`auto-suggest__suggestions ${open && 'auto-suggest__suggestions--open'}`}>
                {
                    suggestions.map((suggestion) => (
                        <li
                            key={renderValue(suggestion)}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className='auto-suggest__suggestion text-ellipses cursor-pointer'
                        >
                            {renderValue(suggestion)}
                        </li>
                    ))
                }
                {!suggestions.length && <li className='auto-suggest__suggestion cursor-pointer'>{'Nothing to show'}</li>}
            </ul>
            {typeof error === 'string' && <p className='auto-suggest__err-text'>{error}</p>}
        </div>
    );
};

export default AutoSuggest;
