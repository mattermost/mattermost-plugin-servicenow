import React, {useCallback, useEffect, useRef, useState} from 'react';

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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focused, setFocused] = useState(false);
    const textInputFieldRef = useRef<HTMLInputElement>(null);
    const autoSuggestRef = useRef<HTMLDivElement>(null);

    const {suggestions, renderValue} = suggestionConfig;

    // Show suggestions depending on the input value, number of characters and whether the input is in focused state
    useEffect(() => {
        setShowSuggestions(inputValue.length >= charThresholdToShowSuggestions && focused);
    }, [charThresholdToShowSuggestions, focused, inputValue]);

    useEffect(() => {
        if (focused) {
            // eslint-disable-next-line no-unused-expressions
            textInputFieldRef.current?.focus();
        } else {
            // eslint-disable-next-line no-unused-expressions
            textInputFieldRef.current?.blur();
        }
    }, [focused]);

    // Close the auto-suggest popover when the user clicks outside
    useEffect(() => {
        const handleCloseAutoSuggest = (e: MouseEvent) => !autoSuggestRef.current?.contains(e.target as Element) && setFocused(false);

        document.addEventListener('click', handleCloseAutoSuggest);

        return () => document.removeEventListener('click', handleCloseAutoSuggest);
    }, []);

    const handleSuggestionClick = useCallback((suggestedValue: Record<string, string>) => {
        onOptionClick(suggestedValue);
        setFocused(false);
    }, [onOptionClick]);

    // Prevent the text input field(which is the field visible in the UI) from blurring if "focused" is set to "true"
    const handleBlur = useCallback(() => focused && textInputFieldRef.current?.focus(), []);

    return (
        <div
            className={`auto-suggest ${disabled && 'auto-suggest--disabled'} ${error && 'auto-suggest--error'} ${className}`}
            ref={autoSuggestRef}
        >
            <div className={`auto-suggest__field cursor-pointer d-flex align-items-center justify-content-between ${focused && 'auto-suggest__field--focused'}`}>
                <input
                    type='checkbox'
                    className='auto-suggest__toggle-input'
                    checked={focused}
                    disabled={disabled}
                    onClick={() => setFocused(true)}
                />
                <input
                    ref={textInputFieldRef}
                    placeholder={`${placeholder ?? ''}${required ? '*' : ''}`}
                    value={inputValue}
                    onChange={(e) => onInputValueChange(e.target.value)}
                    className='auto-suggest__input'
                    disabled={disabled}
                    onBlur={handleBlur}
                />
                {loadingSuggestions ? (
                    <div className='auto-suggest__loader'/>
                ) : (
                    <i className={`fa fa-angle-down auto-suggest__field-angle ${showSuggestions && 'auto-suggest__field-angle--rotated'}`}/>
                )}
            </div>
            {inputValue.length < charThresholdToShowSuggestions && focused && <p className='auto-suggest__get-suggestion-warn'>{`Please enter at least ${charThresholdToShowSuggestions} characters to get suggestions.`}</p>}
            <ul className={`auto-suggest__suggestions ${showSuggestions && 'auto-suggest__suggestions--open'}`}>
                {!suggestions.length || loadingSuggestions ? (
                    <li className='auto-suggest__suggestion cursor-pointer'>{'Nothing to show'}</li>
                ) : suggestions.map((suggestion) => (
                    <li
                        key={renderValue(suggestion)}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className='auto-suggest__suggestion text-ellipses cursor-pointer'
                    >
                        {renderValue(suggestion)}
                    </li>
                ))}
            </ul>
            {typeof error === 'string' && <p className='auto-suggest__err-text'>{error}</p>}
        </div>
    );
};

export default AutoSuggest;
