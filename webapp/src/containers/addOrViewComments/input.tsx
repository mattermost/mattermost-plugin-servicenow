import React from 'react';
import {FormControl} from 'react-bootstrap';
import './styles.scss';

type TextFieldProps = {
    label?: string | JSX.Element;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: boolean | string;
    disabled?: boolean;
    className?: string;
}

const TextField = ({
    label,
    placeholder = '',
    value = '',
    onChange,
    error,
    disabled = false,
    className = '',
}: TextFieldProps) => (
    <div className={`form-group ${className}`}>
        {label && <label className='form-group__label wt-400'>{label}</label>}
        <FormControl
            as='textarea'
            value={value}
            componentClass='textarea'
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e)}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-group__control border-radius-4 ${error && 'form-group__control--err error-text'}`}
        />
        {(error && typeof error === 'string') && <p className='form-group__err-text error-text font-14 margin-top-5'>{error}</p>}
    </div>
);

export default TextField;
