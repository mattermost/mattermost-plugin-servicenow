import React from 'react';

import './styles.scss';

type EmptyStatePropTypes = {
    title: string,
    subTitle?: string,
    buttonConfig?:{
        text: string;
        link?: string;
        download?: boolean;
        action?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    } | null,
    iconClass?: string;
    icon?: JSX.Element;
    className?: string;
}

const EmptyState = ({
    title,
    subTitle,
    buttonConfig,
    iconClass,
    className = '',
    icon,
}: EmptyStatePropTypes) => (
    <div className={`empty-state d-flex align-items-center justify-content-center ${className}`}>
        <div className='d-flex flex-column align-items-center'>
            <div className='empty-state__icon d-flex justify-content-center align-items-center'>
                {icon || <i className={iconClass ?? 'fa fa-wifi'}/>}
            </div>
            <p className='empty-state__title'>{title}</p>
            {subTitle && <p className='empty-state__subtitle'>{subTitle}</p>}
            {buttonConfig?.action && (
                <button
                    onClick={buttonConfig.action}
                    className='empty-state__btn btn btn-primary'
                >
                    {buttonConfig.text}
                </button>
            )}
            {buttonConfig?.link && (
                <a
                    target='_blank'
                    rel='noreferrer'
                    href={buttonConfig.link}
                    className='empty-state__btn btn btn-primary'
                >
                    {buttonConfig.text}
                </a>
            )}
        </div>
    </div>
);

export default EmptyState;
