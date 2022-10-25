import React from 'react';

import './styles.scss';

interface SpinnerProps {
    extraClass?: string;
}

const Spinner = ({extraClass = ''}: SpinnerProps): JSX.Element => (
    <div className={`text-align-center spinner-wrapper ${extraClass}`}>
        <svg
            className='spinner'
            viewBox='0 0 80 80'
            xmlns='http://www.w3.org/2000/svg'
        >
            <circle
                cx='40'
                cy='40'
                r='30'
            />
        </svg>
    </div>
);

export default Spinner;
