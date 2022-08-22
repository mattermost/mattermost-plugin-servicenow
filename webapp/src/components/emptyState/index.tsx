import React from 'react';

import './styles.scss';

type EmptyStatePropTypes = {
    title: string,
    subTitle?: string,
    buttonConfig?:{
        text: string;
        href?: string;
        download?: boolean;
        action?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    } | null,
    iconClass?: string;
}

const EmptyState = ({title, subTitle, buttonConfig, iconClass}: EmptyStatePropTypes) => {
    return (
        <div className='empty-state d-flex align-items-center justify-content-center'>
            <div className='d-flex flex-column align-items-center'>
                <div className='empty-state__icon d-flex justify-content-center align-items-center'>
                    <i className={iconClass ?? 'fa fa-wifi'}/>
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
                {buttonConfig?.href && (
                    <a
                        target='_blank'
                        rel='noreferrer'
                        href={buttonConfig.href}
                        className='empty-state__btn btn btn-primary'
                        download={buttonConfig.download}
                    >
                        {buttonConfig.text}
                    </a>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
