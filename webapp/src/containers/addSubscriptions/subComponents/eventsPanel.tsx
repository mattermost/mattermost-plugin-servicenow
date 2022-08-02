import React, {forwardRef} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Checkbox from 'components/checkbox';

// This will be replaced by global api state of fetch-channel api
import {ChannelDropdownOptions} from './channelPanel';

type EventsPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    stateChanged: boolean;
    setStateChanged: (state: boolean) => void;
    priorityChanged: boolean;
    setPriorityChanged: (priority: boolean) => void;
    newCommentChecked: boolean;
    setNewCommentChecked: (newCommentChecked: boolean) => void;
    assignedToChecked: boolean;
    setAssignedToChecked: (assignedTo: boolean) => void;
    assignmentGroupChecked: boolean;
    setAssignmentGroupChecked: (assignmentGroup: boolean) => void;
    channel: string;
    record: string;
}

const EventsPanel = forwardRef<HTMLDivElement, EventsPanelProps>(({
    className,
    error,
    onBack,
    onContinue,
    actionBtnDisabled,
    stateChanged,
    setStateChanged,
    priorityChanged,
    setPriorityChanged,
    newCommentChecked,
    setNewCommentChecked,
    assignedToChecked,
    setAssignedToChecked,
    assignmentGroupChecked,
    setAssignmentGroupChecked,
    channel,
    record,
}: EventsPanelProps, eventsPanelRef): JSX.Element => {
    return (
        <div
            className={`modal__body modal-body secondary-panel events-panel ${className}`}
            ref={eventsPanelRef}
        >
            <div className='events-panel__prev-data'>
                <h4 className='events-panel__prev-data-header'>{'Channel'}</h4>
                <p className='events-panel__prev-data-text'>
                    {/* TODO: Replace "ChannelDropdownOptions" by global api state of fetch-channel api */}
                    {ChannelDropdownOptions.find((ch) => ch.value === channel)?.label}
                </p>
                <h4 className='events-panel__prev-data-header record-header'>{'Record'}</h4>
                <p className='events-panel__prev-data-text'>{record}</p>
            </div>
            <label className='events-panel__label'>{'Available alert:(optional)'}</label>
            <Checkbox
                checked={stateChanged}
                label='State changed'
                onChange={setStateChanged}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={priorityChanged}
                label='Priority changed'
                onChange={setPriorityChanged}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={newCommentChecked}
                label='New comment'
                onChange={setNewCommentChecked}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={assignedToChecked}
                label='Assigned to changed'
                onChange={setAssignedToChecked}
                className='events-panel__checkbox'
            />
            <Checkbox
                checked={assignmentGroupChecked}
                label='Assignment group changed'
                onChange={setAssignmentGroupChecked}
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
