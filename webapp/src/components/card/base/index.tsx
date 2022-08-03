import React from 'react';

import './styles.scss';

type BaseCardProps = {
    children: JSX.Element,
    className?: string;
}

const BaseCard = ({children, className = ''}: BaseCardProps) => {
    return (
        <div className={`wrapper ${className}`}>{children}</div>
    );
};

export default BaseCard;
