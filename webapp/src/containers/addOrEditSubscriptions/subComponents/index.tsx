import React, {createRef, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import Cookies from 'js-cookie';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import Modal from 'components/modal/customModal';
import ModalHeader from 'components/modal/subComponents/modalHeader';
import ModalLoader from 'components/modal/subComponents/modalLoader';
import CircularLoader from 'components/loader/circular';

import Constants, {PanelDefaultHeights} from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';

import ChannelPanel from './channelPanel';
import AlertTypePanel from './alertTypePanel';
import EventsPanel from './eventsPanel';
import SearchRecordsPanel from './searchRecordsPanel';
import ResultPanel from './resultPanel';

import './styles.scss';

type AddOrEditSubscriptionProps = {
    open: boolean;
    close: () => void;
    subscriptionData?: EditSubscriptionData;
};

const AddOrEditSubscription = ({open, close, subscriptionData}: AddOrEditSubscriptionProps) => {
    // Channel panel values
    const [channel, setChannel] = useState<string | null>(null);

    // Record panel values
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);

    // Alert type panel
    const [alertType, setAlertType] = useState<null | RecordType>(null);

    // Opened panel states
    const [alertTypePanelOpen, setAlertTypePanelOpen] = useState(false);
    const [searchRecordsPanelOpen, setSearchRecordsPanelOpen] = useState(false);
    const [eventsPanelOpen, setEventsPanelOpen] = useState(false);
    const [successPanelOpen, setSuccessPanelOpen] = useState(false);

    // Events panel values
    const [stateChanged, setStateChanged] = useState(false);
    const [priorityChanged, setPriorityChanged] = useState(false);
    const [newCommentChecked, setNewCommentChecked] = useState(false);
    const [assignedToChecked, setAssignedToChecked] = useState(false);
    const [assignmentGroupChecked, setAssignmentGroupChecked] = useState(false);

    // API error
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiResponseValid, setApiResponseValid] = useState(false);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // Create subscription payload
    const [createSubscriptionPayload, setCreateSubscriptionPayload] = useState<CreateSubscriptionPayload | null>(null);
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // usePluginApi hook
    const {state: APIState, makeApiRequest, getApiState} = usePluginApi();

    // Create refs to access height of the panels and providing height to modal-dialog
    // We've made all the panel absolute positioned to apply animations and because they are absolute positioned, there parent container, which is modal-dialog, won't expand same as their heights
    const channelPanelRef = createRef<HTMLDivElement>();
    const alertTypePanelRef = createRef<HTMLDivElement>();
    const searchRecordsPanelRef = createRef<HTMLDivElement>();
    const eventsPanelRef = createRef<HTMLDivElement>();
    const resultPanelRef = createRef<HTMLDivElement>();

    // Get create subscription state
    const getCreateSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, createSubscriptionPayload as CreateSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    useEffect(() => {
        if (open && subscriptionData) {
            // Set values for channel panel
            setChannel(subscriptionData.channel);

            // Set initial values for alert-type panel
            setAlertType(subscriptionData.alertType);

            // Set initial values for search-record panel
            setRecordValue(subscriptionData.recordValue);
            setSuggestionChosen(true);

            // Set initial values for events panel
            setStateChanged(subscriptionData.stateChanged);
            setPriorityChanged(subscriptionData.priorityChanged);
            setNewCommentChecked(subscriptionData.newCommentChecked);
            setAssignedToChecked(subscriptionData.assignedToChecked);
            setAssignmentGroupChecked(subscriptionData.assignmentGroupChecked);
        }
    }, [open, subscriptionData]);

    useEffect(() => {
        const createSubscriptionState = getCreateSubscriptionState();
        if (createSubscriptionState.isLoading) {
            setApiResponseValid(true);
        }
        if (createSubscriptionState.isError && apiResponseValid) {
            setApiError(createSubscriptionState.error);
        }
        if (createSubscriptionState.data) {
            setSuccessPanelOpen(true);
        }
        setShowModalLoader(createSubscriptionState.isLoading);
    }, [APIState]);

    // Reset input field states
    const resetFieldStates = () => {
        setChannel(null);
        setRecordValue('');
        setSuggestionChosen(false);
        setAlertType(null);
        setStateChanged(false);
        setPriorityChanged(false);
        setNewCommentChecked(false);
        setAssignedToChecked(false);
        setAssignmentGroupChecked(false);
    };

    // Reset panel states
    const resetPanelStates = () => {
        setAlertTypePanelOpen(false);
        setSearchRecordsPanelOpen(false);
        setEventsPanelOpen(false);
        setSuccessPanelOpen(false);
    };

    // Reset error states
    const resetError = () => {
        setApiResponseValid(false);
        setApiError(null);
    };

    const hideModal = () => {
        // Reset modal states
        resetFieldStates();
        resetError();

        // Reset payload
        setCreateSubscriptionPayload(null);

        // Close the modal
        close();

        // Resetting opened panel states so that there isn't unnecessary jump from one panel to another while closing the modal
        setTimeout(() => {
            resetPanelStates();
        }, 500);
    };

    // Handle action when add another subscription button is clicked
    const addAnotherSubscription = () => {
        resetFieldStates();
        resetPanelStates();
        setCreateSubscriptionPayload(null);
    };

    // Handle action when back button is clicked on failure modal
    const resetFailureState = () => {
        resetPanelStates();
        resetError();
        setCreateSubscriptionPayload(null);
    };

    // Set height of the modal content according to different panels;
    // Added 65 in the given height due of (header + loader) height
    const setModalDialogHeight = (bodyHeight: number) => document.querySelectorAll('.rhs-modal.add-edit-subscription-modal .modal-content').forEach((modalContent) => modalContent.setAttribute('style', `height:${bodyHeight + PanelDefaultHeights.panelHeader}px`));

    // Change height of the modal depending on the height of the visible panel
    useEffect(() => {
        let height;

        if (successPanelOpen || (apiError && apiResponseValid)) {
            height = resultPanelRef.current?.offsetHeight || PanelDefaultHeights.successPanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            resultPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (eventsPanelOpen) {
            height = eventsPanelRef.current?.offsetHeight || PanelDefaultHeights.eventsPanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            eventsPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (searchRecordsPanelOpen) {
            height = searchRecordsPanelRef.current?.offsetHeight || PanelDefaultHeights.searchRecordPanel;

            if (suggestionChosen && height < 350) {
                height = PanelDefaultHeights.searchRecordPanelExpanded;
            }

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            searchRecordsPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (alertTypePanelOpen) {
            height = alertTypePanelRef.current?.offsetHeight || PanelDefaultHeights.alertTypePanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            alertTypePanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (!alertTypePanelOpen && !searchRecordsPanelOpen && !eventsPanelOpen) {
            height = channelPanelRef.current?.offsetHeight || PanelDefaultHeights.channelPanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            channelPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
        }

        // Disabling the eslint rule below because we can't include refs in the dependency array otherwise it causes a lot of unnecessary changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventsPanelOpen, searchRecordsPanelOpen, alertTypePanelOpen, apiError, apiResponseValid, suggestionChosen, successPanelOpen]);

    // Returns action handler for primary button in the result panel
    const getResultPanelPrimaryBtnActionOrText = (action: boolean) => {
        if (apiError && apiResponseValid) {
            return action ? resetFailureState : 'Back';
        } else if (subscriptionData) {
            return null;
        }
        return action ? addAnotherSubscription : 'Add Another Subscription';
    };

    // Returns heading for the result panel
    const getResultPanelHeader = () => {
        if (apiError && apiResponseValid) {
            return apiError;
        } else if (subscriptionData) {
            return 'Subscription updated successfully! ';
        }
        return null;
    };

    // Handles create subscription
    const createSubscription = () => {
        let subscriptionEvents = '';
        setApiError(null);

        // Add checked events
        if (stateChanged) {
            subscriptionEvents += 'state ';
        }
        if (priorityChanged) {
            subscriptionEvents += 'priority ';
        }
        if (newCommentChecked) {
            subscriptionEvents += 'commented ';
        }
        if (assignedToChecked) {
            subscriptionEvents += 'assigned_to ';
        }
        if (assignmentGroupChecked) {
            subscriptionEvents += 'assignment_group';
        }

        // Create subscription payload
        const payload: CreateSubscriptionPayload = {
            server_url: SiteURL ?? '',
            is_active: true,
            user_id: Cookies.get(Constants.MMUSERID) ?? '',
            type: 'record',
            record_type: alertType as string,

            // TODO: modify to access record_id here
            record_id: recordId as string,
            subscription_events: subscriptionEvents.trim().split(' ').join(', '),
            channel_id: channel as string,
        };

        // Set payload
        setCreateSubscriptionPayload(payload);

        // Make API request for creating the subscription
        makeApiRequest(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, payload);
    };

    return (
        <Modal
            show={open}
            onHide={hideModal}

            // If these classes are updated, please also update the query in the "setModalDialogHeight" function which is defined above.
            className='rhs-modal add-edit-subscription-modal'
        >
            <>
                <ModalHeader
                    title={subscriptionData ? 'Edit Subscription' : 'Add Subscription'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <ModalLoader loading={showModalLoader}/>
                <ChannelPanel
                    className={`
                        ${alertTypePanelOpen && 'channel-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'chanel-panel--fade-out'}
                    `}
                    ref={channelPanelRef}
                    onContinue={() => setAlertTypePanelOpen(true)}
                    channel={channel}
                    setChannel={setChannel}
                    setShowModalLoader={setShowModalLoader}
                />
                <AlertTypePanel
                    className={`
                        ${alertTypePanelOpen && 'secondary-panel--slide-in'}
                        ${(searchRecordsPanelOpen || eventsPanelOpen) && 'secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'secondary-panel--fade-out'}
                    `}
                    ref={alertTypePanelRef}
                    onContinue={() => setSearchRecordsPanelOpen(true)}
                    onBack={() => setAlertTypePanelOpen(false)}
                    alertType={alertType}
                    setAlertType={setAlertType}
                />
                <SearchRecordsPanel
                    className={`
                        ${searchRecordsPanelOpen && 'secondary-panel--slide-in'}
                        ${(eventsPanelOpen) && 'secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'secondary-panel--fade-out'}
                    `}
                    ref={searchRecordsPanelRef}
                    onContinue={() => {
                        if (recordValue) {
                            setEventsPanelOpen(true);
                        } else {
                            setApiError('Please select a record(This is placeholder text for error).');
                            setApiResponseValid(true);
                        }
                    }}
                    onBack={() => setSearchRecordsPanelOpen(false)}
                    recordValue={recordValue}
                    setRecordValue={setRecordValue}
                    suggestionChosen={suggestionChosen}
                    setSuggestionChosen={setSuggestionChosen}
                    recordType={alertType}
                    setApiError={setApiError}
                    setApiResponseValid={setApiResponseValid}
                    setShowModalLoader={setShowModalLoader}
                    recordId={recordId}
                    setRecordId={setRecordId}
                />
                <EventsPanel
                    className={`
                        ${eventsPanelOpen && 'secondary-panel--slide-in'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'secondary-panel--fade-out'}
                    `}
                    ref={eventsPanelRef}
                    onContinue={createSubscription}
                    onBack={() => setEventsPanelOpen(false)}
                    stateChanged={stateChanged}
                    setStateChanged={setStateChanged}
                    priorityChanged={priorityChanged}
                    setPriorityChanged={setPriorityChanged}
                    newCommentChecked={newCommentChecked}
                    setNewCommentChecked={setNewCommentChecked}
                    assignedToChecked={assignedToChecked}
                    setAssignedToChecked={setAssignedToChecked}
                    assignmentGroupChecked={assignmentGroupChecked}
                    setAssignmentGroupChecked={setAssignmentGroupChecked}
                    channel={channel as string}
                    record={recordValue}
                />
                <ResultPanel
                    onPrimaryBtnClick={getResultPanelPrimaryBtnActionOrText(true) as (() => void) | null}
                    onSecondaryBtnClick={hideModal}
                    className={`${(successPanelOpen || (apiError && apiResponseValid)) && 'secondary-panel--slide-in'}`}
                    ref={resultPanelRef}
                    primaryBtnText={getResultPanelPrimaryBtnActionOrText(false) as string | null}
                    iconClass={apiError && apiResponseValid ? 'fa-times-circle-o result-panel-icon--error' : null}
                    header={getResultPanelHeader()}
                />
                {false && <CircularLoader/>}
            </>
        </Modal>
    );
};

export default AddOrEditSubscription;
