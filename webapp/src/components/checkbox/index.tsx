import React from 'react';

import './styles.scss';

type CheckboxProps = {
    checked: boolean;
    label?: string | JSX.Element;
    onChange: (checked: boolean) => void;
    className?: string;
}

const Checkbox = ({checked, label, onChange, className = ''}: CheckboxProps): JSX.Element => {
    return (
        <div className={`checkbox d-flex align-items-center ${className}`}>
            <input
                type='checkbox'
                checked={checked}
                className='checkbox__input-field cursor-pointer'
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className='checkbox__box d-flex justify-content-between align-items-center'>
                <i className='fa fa-check checkbox__tick'/>
            </div>
            {label && <label className='checkbox__label'>{label}</label>}
        </div>
    );
};

export default Checkbox;
