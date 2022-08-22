import React, {forwardRef} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Checkbox from 'components/checkbox';
import {SubscriptionEventsEnum} from 'plugin_constants';

type EventsPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    subscriptionEvents: SubscriptionEventsEnum[];
    setSubscriptionEvents: React.Dispatch<React.SetStateAction<SubscriptionEventsEnum[]>>;
    channel: DropdownOptionType | null;
    record: string;
}

const EventsPanel = forwardRef<HTMLDivElement, EventsPanelProps>(({
    className,
    error,
    onBack,
    onContinue,
    actionBtnDisabled,
    subscriptionEvents,
    setSubscriptionEvents,
    channel,
    record,
}: EventsPanelProps, eventsPanelRef): JSX.Element => {
    const handleSelectedEventsChange = (selected: boolean, event: SubscriptionEventsEnum) => {
        const filterEvents = (
            events: SubscriptionEventsEnum[],
        ): SubscriptionEventsEnum[] => (
            events.filter((currentEvent) => currentEvent !== event)
        );

        return selected ? (
            setSubscriptionEvents((prev: SubscriptionEventsEnum[]) => ([...prev, event]))
        ) : (
            setSubscriptionEvents((prev: SubscriptionEventsEnum[]) => filterEvents(prev))
        );
    };

    return (
        <div
            className={`modal__body modal-body secondary-panel events-panel ${className}`}
            ref={eventsPanelRef}
        >
            <div className='events-panel__prev-data'>
                <h4 className='events-panel__prev-data-header'>{'Channel'}</h4>
                <p className='events-panel__prev-data-text'>
                    {channel?.label}
                </p>
                <h4 className='events-panel__prev-data-header record-header'>{'Record'}</h4>
                <p className='events-panel__prev-data-text'>{record}</p>
            </div>
            <label className='events-panel__label'>{'Available alert:(optional)'}</label>
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEventsEnum.state)}
                label='State changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEventsEnum.state)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEventsEnum.priority)}
                label='Priority changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEventsEnum.priority)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEventsEnum.commented)}
                label='New comment'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEventsEnum.commented)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEventsEnum.assignedTo)}
                label='Assigned to changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEventsEnum.assignedTo)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEventsEnum.assignmentGroup)}
                label='Assignment group changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEventsEnum.assignmentGroup)}
                className='events-panel__checkbox'
            />
            <ModalSubTitleAndError error={error}/>
            <ModalFooter
                onHide={onBack}
                onConfirm={onContinue}
                cancelBtnText='Back'
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
                cancelDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default EventsPanel;
