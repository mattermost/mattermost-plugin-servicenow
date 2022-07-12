import React from 'react';

import {ToggleSwitchLabelPositioning} from 'plugin_constants';

import './styles.scss';

type ToggleSwitchProps = {
    active: boolean;
    onChange: (active: boolean) => void;
    label?: string;
    labelPositioning?: ToggleSwitchLabelPositioning;
}

const ToggleSwitch = ({active, onChange, label, labelPositioning = ToggleSwitchLabelPositioning.Left}: ToggleSwitchProps): JSX.Element => {
    return (
        <div className={`toggle-switch-container d-flex align-items-center ${labelPositioning === ToggleSwitchLabelPositioning.Right && 'flex-row-reverse'}`}>
            {label && <span className={labelPositioning === ToggleSwitchLabelPositioning.Left ? 'toggle-switch-label--left' : 'toggle-switch-label--right'}>{label}</span>}
            <label className='toggle-switch'>
                <input
                    type='checkbox'
                    className='toggle-switch__input'
                    checked={active}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className='toggle-switch__slider'/>
            </label>
        </div>
    );
};

export default ToggleSwitch;
