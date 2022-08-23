import React from 'react';

import './styles.scss';

type EmptyStatePropTypes = {
    title: string,
    subTitle?: string,
    buttonConfig?:{
        text: string;
        action: (event: React.MouseEvent<HTMLButtonElement>) => void;
    }
    iconClass?: string;
}

const EmptyState = ({
    title,
    subTitle,
    buttonConfig,
    iconClass,
}: EmptyStatePropTypes) => (
    <div className='empty-state d-flex align-items-center justify-content-center'>
        <div className='d-flex flex-column align-items-center'>
            <div className='empty-state__icon d-flex justify-content-center align-items-center'>
                <i className={iconClass ?? 'fa fa-wifi'}/>
            </div>
            <p className='empty-state__title'>{title}</p>
            {subTitle && <p className='empty-state__subtitle'>{subTitle}</p>}
            {buttonConfig && (
                <button
                    onClick={buttonConfig.action}
                    className='empty-state__btn btn btn-primary'
                >
                    {buttonConfig.text}
                </button>
            )}
        </div>
    </div>
);

export default EmptyState;
