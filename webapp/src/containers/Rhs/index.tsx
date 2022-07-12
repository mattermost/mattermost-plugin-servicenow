import React, {useState} from 'react';

import ToggleSwitch from 'components/toggleSwitch';
import {ToggleSwitchLabelPositioning} from 'plugin_constants';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const [active, setActive] = useState(false);

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label='Show all subscriptions'
            />
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label='Show all subscriptions'
                labelPositioning={ToggleSwitchLabelPositioning.Right}
            />
            <div className='rhs-btn-container'>
                <button
                    className='btn btn-primary rhs-btn'
                    onClick={() => ''}
                >
                    {'Add Subscription'}
                </button>
            </div>
        </div>
    );
};

export default Rhs;
