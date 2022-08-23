import React, {forwardRef} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Checkbox from 'components/checkbox';
import {SubscriptionEvents} from 'plugin_constants';

type EventsPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    subscriptionEvents: SubscriptionEvents[];
    setSubscriptionEvents: React.Dispatch<React.SetStateAction<SubscriptionEvents[]>>;
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
    const handleSelectedEventsChange = (selected: boolean, event: SubscriptionEvents) => {
        const filterEvents = (events: SubscriptionEvents[]): SubscriptionEvents[] => (
            events.filter((currentEvent) => currentEvent !== event)
        );

        return selected ? (
            setSubscriptionEvents((prev: SubscriptionEvents[]) => ([...prev, event]))
        ) : (
            setSubscriptionEvents((prev: SubscriptionEvents[]) => filterEvents(prev))
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
                checked={subscriptionEvents.includes(SubscriptionEvents.state)}
                label='State changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.state)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.priority)}
                label='Priority changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.priority)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.commented)}
                label='New comment'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.commented)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.assignedTo)}
                label='Assigned to changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.assignedTo)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.assignmentGroup)}
                label='Assignment group changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.assignmentGroup)}
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
