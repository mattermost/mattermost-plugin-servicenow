import React, {useState} from 'react';

import ToggleSwitch from 'components/toggleSwitch';
import Constants, {ToggleSwitchLabelPositioning} from 'plugin_constants';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const [active, setActive] = useState(false);

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label={Constants.RhsToggleLabel}
            />
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label={Constants.RhsToggleLabel}
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
