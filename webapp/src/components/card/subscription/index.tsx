import React from 'react';

import BaseCard from 'components/card/base';
import Popover from 'components/popover';
import MenuButtons from 'components/buttons/menuButtons';

import './styles.scss';

type SubscriptionCardProps = {
    header: string;
    label?: string;
    cardBody?: [
        {
            label: string,
            value: string,
        }
    ];
    description?: string;
}

const SubscriptionCard = ({header, label, cardBody, description}: SubscriptionCardProps) => {
    const buttonMenuPopover = (
        <Popover
            popoverBody={
                <MenuButtons
                    buttons={[
                        {
                            icon: 'fa fa-pencil-square-o',
                            text: 'Edit',
                            onClick: () => '',
                        },
                        {
                            icon: 'fa fa-trash-o',
                            text: 'Delete',
                            onClick: () => '',
                        },
                    ]}
                />
            }
            className='subscription-card__popover'
        >
            <button className='style--none subscription-card__menu-btn'>
                <i className='fa fa-ellipsis-v'/>
            </button>
        </Popover>
    );

    return (
        <BaseCard className='subscription-card'>
            <>
                <div className='subscription-card__header d-flex justify-content-between'>
                    <p className='subscription-card__header-text'>{header}</p>
                    {buttonMenuPopover}
                </div>
                {label && <div className='subscription-card__label'>{label}</div>}
                {(cardBody || description) && (
                    <ul className='subscription-card__body'>
                        {cardBody?.map((bodyItem) => (
                            <li
                                key={bodyItem.label}
                                className='subscription-card__body-item'
                            >
                                <span className='subscription-card__body-header'>{bodyItem.label + ':'}</span>
                                <span className='subscription-card__body-text'>{bodyItem.value}</span>
                            </li>
                        ))}
                        {description && (
                            <li
                                className='subscription-card__body-item'
                            >
                                {description}
                            </li>
                        )}
                    </ul>
                )}
            </>
        </BaseCard>
    );
};

export default SubscriptionCard;
