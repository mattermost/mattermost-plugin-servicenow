import React, {useMemo} from 'react';

import BaseCard from 'components/card/base';
import Popover from 'components/popover';
import MenuButtons from 'components/buttons/menuButtons';

import {DeleteIcon, EditIcon, GlobeIcon, LockIcon} from 'containers/icons';

import Constants from 'plugin_constants';

import './styles.scss';

type SubscriptionCardProps = {
    header: string | JSX.Element;
    label?: string;
    cardBody?: SubscriptionCardBody;
    description?: string;
    channel?: ChannelData | null;
    onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const SubscriptionCard = ({
    header,
    label,
    cardBody,
    description,
    onDelete,
    onEdit,
    channel,
}: SubscriptionCardProps) => {
    const buttonMenuPopover = useMemo(() => (
        <Popover
            popoverBody={
                <MenuButtons
                    buttons={[
                        {
                            icon: <EditIcon className='subscription-card__popover-icon'/>,
                            text: 'Edit',
                            onClick: onEdit,
                        },
                        {
                            icon: <DeleteIcon className='subscription-card__popover-icon'/>,
                            text: 'Delete',
                            onClick: onDelete,
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
    ), [onEdit, onDelete]);

    return (
        <BaseCard className='subscription-card'>
            <>
                <div className='subscription-card__header d-flex justify-content-between'>
                    <p className='subscription-card__header-text text-ellipsis'>{header}</p>
                    {buttonMenuPopover}
                </div>
                {channel && (
                    <div className='subscription-card__channel d-flex align-items-center'>
                        {channel.type === Constants.PrivateChannelType ? <LockIcon className='channel-icon'/> : <GlobeIcon className='channel-icon'/>}
                        <span className='subscription-card__channel-text text-ellipsis'>{channel.display_name}</span>
                    </div>
                )}
                {label && <div className='subscription-card__label text-ellipsis'>{label}</div>}
                {(cardBody || description) && (
                    <ul className='subscription-card__body'>
                        {cardBody?.list?.map((listItem: string | JSX.Element, index: number) => (
                            <li
                                key={index}
                                className='subscription-card__body-item subscription-card__body-item--list'
                            >
                                {listItem}
                            </li>
                        ))}
                        {cardBody?.labelValuePairs?.map((bodyItem, index: number) => (
                            <li
                                key={bodyItem.label}
                                className={`text-ellipsis subscription-card__body-item ${cardBody?.list?.length && !index && 'subscription-card__body-item--top-margin'}`}
                            >
                                <span className='subscription-card__body-header'>{bodyItem.label + ':'}</span>
                                <span className='subscription-card__body-text'>{bodyItem.value}</span>
                            </li>
                        ))}
                        {description && (
                            <li
                                className='subscription-card__body-item text-ellipsis'
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
