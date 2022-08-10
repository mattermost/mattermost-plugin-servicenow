import React, {forwardRef, useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Checkbox from 'components/checkbox';

import Constants from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';

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
    const {entities} = useSelector((state: GlobalState) => state);
    const {state: APIState, getApiState} = usePluginApi();
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);

    // Update the channelList once it is fetched from the backend
    useEffect(() => {
        const channelListState = getChannelState();
        if (channelListState.data) {
            setChannelOptions(channelListState.data?.map((ch) => ({label: <span><i className='fa fa-globe dropdown-option-icon'/>{ch.display_name}</span>, value: ch.id})));
        }

        // Disabling the react-hooks/exhaustive-deps rule at the next line because if we include "getMmApiState" in the dependency array, the useEffect runs infinitely.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [APIState]);

    // Get channelList state
    const getChannelState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: entities.teams.currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelList[], error: ((apiErr as FetchBaseQueryError)?.data as {error?: string})?.error};
    };

    return (
        <div
            className={`modal__body modal-body secondary-panel events-panel ${className}`}
            ref={eventsPanelRef}
        >
            <div className='events-panel__prev-data'>
                <h4 className='events-panel__prev-data-header'>{'Channel'}</h4>
                <p className='events-panel__prev-data-text'>
                    {channelOptions.find((ch) => ch.value === channel)?.label}
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
