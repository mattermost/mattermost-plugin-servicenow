// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef} from 'react';

import {ModalSubtitleAndError, ModalFooter, Checkbox} from '@brightscout/mattermost-ui-library';

import {SubscriptionEvents, RecordTypeLabelMap, RecordType, SubscriptionType, SubscriptionEventLabels} from 'src/plugin_constants';

type EventsPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    continueBtnDisabled?: boolean;
    backBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    subscriptionEvents: SubscriptionEvents[];
    setSubscriptionEvents: React.Dispatch<React.SetStateAction<SubscriptionEvents[]>>;
    channel: DropdownOptionType | null;
    subscriptionType: SubscriptionType;
    record: string;
    recordType: RecordType;
}

const EventsPanel = forwardRef<HTMLDivElement, EventsPanelProps>(({
    className,
    error,
    onBack,
    onContinue,
    continueBtnDisabled,
    backBtnDisabled,
    subscriptionEvents,
    setSubscriptionEvents,
    channel,
    subscriptionType,
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
            className={`modal__body wizard__secondary-panel events-panel ${className}`}
            ref={eventsPanelRef}
        >
            <div className='padding-h-12 padding-v-20 wizard__body-container'>
                <div className='events-panel__prev-data border-radius-8 padding-v-10 padding-h-25 margin-bottom-25'>
                    <h4 className='events-panel__prev-data-header font-14 wt-400 margin-0'>{'Channel'}</h4>
                    <p className='events-panel__prev-data-text font-14 wt-400 margin-v-5'>
                        {channel?.label}
                    </p>
                    <h4 className='events-panel__prev-data-header font-14 wt-400 margin-top-15 record-header'>{`Record${subscriptionType === SubscriptionType.BULK ? ' type' : ''}`}</h4>
                    <p className='events-panel__prev-data-text font-14 wt-400 margin-v-5'>{subscriptionType === SubscriptionType.RECORD ? record : RecordTypeLabelMap[recordType]}</p>
                </div>
                <label className='events-panel__label font-16 margin-bottom-12 wt-400'>{'Available events:'}</label>
                {subscriptionType === SubscriptionType.BULK && (
                    <Checkbox
                        checked={subscriptionEvents.includes(SubscriptionEvents.CREATED)}
                        label={SubscriptionEventLabels[SubscriptionEvents.CREATED]}
                        onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.CREATED)}
                        className='margin-bottom-20'
                    />
                )}
                <Checkbox
                    checked={subscriptionEvents.includes(SubscriptionEvents.STATE)}
                    label={SubscriptionEventLabels[SubscriptionEvents.STATE]}
                    onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.STATE)}
                    className='margin-bottom-20'
                />
                <Checkbox
                    checked={subscriptionEvents.includes(SubscriptionEvents.PRIORITY)}
                    label={SubscriptionEventLabels[SubscriptionEvents.PRIORITY]}
                    onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.PRIORITY)}
                    className='margin-bottom-20'
                />
                <Checkbox
                    checked={subscriptionEvents.includes(SubscriptionEvents.COMMENTED)}
                    label={SubscriptionEventLabels[SubscriptionEvents.COMMENTED]}
                    onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.COMMENTED)}
                    className='margin-bottom-20'
                />
                <Checkbox
                    checked={subscriptionEvents.includes(SubscriptionEvents.ASSIGNED_TO)}
                    label={SubscriptionEventLabels[SubscriptionEvents.ASSIGNED_TO]}
                    onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.ASSIGNED_TO)}
                    className='margin-bottom-20'
                />
                <Checkbox
                    checked={subscriptionEvents.includes(SubscriptionEvents.ASSIGNMENT_GROUP)}
                    label={SubscriptionEventLabels[SubscriptionEvents.ASSIGNMENT_GROUP]}
                    onChange={(selected: boolean) => handleSelectedEventsChange(selected, SubscriptionEvents.ASSIGNMENT_GROUP)}
                    className='events-panel__checkbox'
                />
                <ModalSubtitleAndError error={error}/>
            </div>
            <ModalFooter
                onHide={onBack}
                onConfirm={onContinue}
                cancelBtnText='Back'
                confirmBtnText='Continue'
                confirmDisabled={continueBtnDisabled}
                cancelDisabled={backBtnDisabled}
            />
        </div>
    );
});

export default EventsPanel;
