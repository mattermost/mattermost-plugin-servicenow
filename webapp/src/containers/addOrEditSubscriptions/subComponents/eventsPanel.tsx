import React, {forwardRef} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Checkbox from 'components/checkbox';

import {SubscriptionEvents, RecordTypeLabelMap, RecordType} from 'plugin_constants';

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
    recordType: RecordType;
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
    recordType,
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
                <h4 className='events-panel__prev-data-header record-header'>{record ? 'Record' : 'Record type'}</h4>
                <p className='events-panel__prev-data-text'>{record || RecordTypeLabelMap[recordType]}</p>
            </div>
            <label className='events-panel__label'>{'Available events:(optional)'}</label>
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.STATE)}
                label='State changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.STATE)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.PRIORITY)}
                label='Priority changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.PRIORITY)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.COMMENTED)}
                label='New comment'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.COMMENTED)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.ASSIGNED_TO)}
                label='Assigned to changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.ASSIGNED_TO)}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={subscriptionEvents.includes(SubscriptionEvents.ASSIGNMENT_GROUP)}
                label='Assignment group changed'
                onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.ASSIGNMENT_GROUP)}
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
