import React, {useEffect, useState} from 'react';

import './styles.scss';

type AutoSuggestProps = {
    inputValue: string;
    onInputValueChange: (newValue: string) => void;
    placeholder?: string;
    suggestions: string[];
    loadingSuggestions?: boolean;
    charThresholdToShowSuggestions?: number;
    disabled?: boolean;
}

const AutoSuggest = ({inputValue, onInputValueChange, placeholder, suggestions, loadingSuggestions, charThresholdToShowSuggestions, disabled}: AutoSuggestProps) => {
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);

    // Show suggestions depending on the input value, number of characters and whether the input is in focused state
    useEffect(() => {
        setOpen(inputValue.length >= (charThresholdToShowSuggestions ?? 1) && focused);
    }, [charThresholdToShowSuggestions, focused, inputValue]);

    const handleSuggestionClick = (suggestedValue: string) => {
        onInputValueChange(suggestedValue);
        setOpen(false);
    };

    return (
        <div className={`auto-suggest ${disabled && 'auto-suggest--disabled'}`}>
            <div className={`auto-suggest__field cursor-pointer d-flex align-items-center justify-content-between ${focused && 'auto-suggest__field--focused'}`}>
                <input
                    placeholder={placeholder ?? ''}
                    value={inputValue}
                    onChange={(e) => onInputValueChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    className='auto-suggest__input'
                    disabled={disabled}
                />
                {!loadingSuggestions && <i className={`fa fa-angle-down auto-suggest__field-angle ${open && 'auto-suggest__field-angle--rotated'}`}/>}
                {loadingSuggestions && <div className='auto-suggest__loader'/>}
            </div>
            {inputValue.length < (charThresholdToShowSuggestions || 1) && focused && <p className='auto-suggest__get-suggestion-warn'>{`Please enter at least ${charThresholdToShowSuggestions} characters to get suggestions.`}</p>}
            <ul className={`auto-suggest__suggestions ${open && 'auto-suggest__suggestions--open'}`}>
                {
                    suggestions.map((suggestion) => (
                        <li
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className='auto-suggest__suggestion text-ellipses cursor-pointer'
                        >{suggestion}</li>
                    ))
                }
                {!suggestions.length && <li className='auto-suggest__suggestion'>{'Nothing to show'}</li>}
            </ul>
        </div>
    );
};

export default AutoSuggest;
