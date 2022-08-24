import React, {createRef, useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import Cookies from 'js-cookie';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import Modal from 'components/modal/customModal';
import ModalHeader from 'components/modal/subComponents/modalHeader';
import ModalLoader from 'components/modal/subComponents/modalLoader';
import CircularLoader from 'components/loader/circular';

import Constants, {PanelDefaultHeights, SubscriptionEvents} from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';

import ChannelPanel from './channelPanel';
import RecordTypePanel from './recordTypePanel';
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
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);

    // Record panel values
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [resetRecordPanelStates, setResetRecordPanelStates] = useState(false);

    // Alert type panel
    const [recordType, setRecordType] = useState<null | RecordType>(null);

    // Opened panel states
    const [recordTypePanelOpen, setRecordTypePanelOpen] = useState(false);
    const [searchRecordsPanelOpen, setSearchRecordsPanelOpen] = useState(false);
    const [eventsPanelOpen, setEventsPanelOpen] = useState(false);
    const [successPanelOpen, setSuccessPanelOpen] = useState(false);

    // Events panel values
    const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvents[]>([]);

    // API error
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiResponseValid, setApiResponseValid] = useState(false);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // Create subscription payload
    const [createSubscriptionPayload, setCreateSubscriptionPayload] = useState<CreateSubscriptionPayload | null>(null);
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // Edit subscription payload
    const [editSubscriptionPayload, setEditSubscriptionPayload] = useState<EditSubscriptionPayload | null>(null);

    // usePluginApi hook
    const {state: APIState, makeApiRequest, getApiState} = usePluginApi();

    // Create refs to access height of the panels and providing height to modal-dialog
    // We've made all the panels absolute positioned to apply animations and because they are absolute positioned, their parent container, which is modal-dialog, won't expand the same as their heights
    const channelPanelRef = createRef<HTMLDivElement>();
    const recordTypePanelRef = createRef<HTMLDivElement>();
    const searchRecordsPanelRef = createRef<HTMLDivElement>();
    const eventsPanelRef = createRef<HTMLDivElement>();
    const resultPanelRef = createRef<HTMLDivElement>();

    const getCreateSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, createSubscriptionPayload as CreateSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data as {message?: string})?.message as string};
    };

    // Get edit subscription state
    const getEditSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.editSubscription.apiServiceName, editSubscriptionPayload as EditSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    useEffect(() => {
        if (open && subscriptionData) {
            // Set values for channel panel
            setChannel(subscriptionData.channel);

            // Set initial values for record-type panel
            setRecordType(subscriptionData.recordType);

            // Set initial values for search-record panel
            setRecordId(subscriptionData.recordId);
            setSuggestionChosen(true);

            // Set initial value for events panel
            setSubscriptionEvents(subscriptionData.subscriptionEvents);
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

    useEffect(() => {
        const editSubscriptionState = getEditSubscriptionState();
        if (editSubscriptionState.isLoading) {
            setApiResponseValid(true);
        }
        if (editSubscriptionState.isError && apiResponseValid) {
            setApiError(editSubscriptionState.error);
        }
        if (editSubscriptionState.data && apiResponseValid) {
            setSuccessPanelOpen(true);
        }
        setShowModalLoader(editSubscriptionState.isLoading);
    }, [APIState]);

    // Reset input field states
    const resetFieldStates = useCallback(() => {
        setChannel(null);
        setRecordValue('');
        setSuggestionChosen(false);
        setRecordType(null);
        setSubscriptionEvents([]);
    }, []);

    // Reset panel states
    const resetPanelStates = useCallback(() => {
        setRecordTypePanelOpen(false);
        setSearchRecordsPanelOpen(false);
        setEventsPanelOpen(false);
        setSuccessPanelOpen(false);
    }, []);

    // Reset error states
    const resetError = useCallback(() => {
        setApiResponseValid(false);
        setApiError(null);
    }, []);

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
    const addAnotherSubscription = useCallback(() => {
        resetFieldStates();
        resetPanelStates();
        setCreateSubscriptionPayload(null);
    }, []);

    // Handle action when back button is clicked on failure modal
    const resetFailureState = useCallback(() => {
        resetPanelStates();
        resetError();
        setCreateSubscriptionPayload(null);
    }, []);

    // Set the height of the modal content according to different panels;
    // Added 65 in the given height because of (header + loader) height
    const setModalDialogHeight = (bodyHeight: number) => {
        const setHeight = (modalContent: Element) => modalContent.setAttribute('style', `height:${bodyHeight + PanelDefaultHeights.panelHeader}px`);

        // Select all the modal-content elements and set the height
        document.querySelectorAll('.rhs-modal.add-edit-subscription-modal .modal-content').forEach((modalContent) => setHeight(modalContent));
    };

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

            if (suggestionChosen && height < PanelDefaultHeights.searchRecordPanelExpanded) {
                height = PanelDefaultHeights.searchRecordPanelExpanded;
            }

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            searchRecordsPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (recordTypePanelOpen) {
            height = recordTypePanelRef.current?.offsetHeight || PanelDefaultHeights.recordTypePanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            recordTypePanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
            return;
        }
        if (!recordTypePanelOpen && !searchRecordsPanelOpen && !eventsPanelOpen) {
            height = channelPanelRef.current?.offsetHeight || PanelDefaultHeights.channelPanel;

            setModalDialogHeight(height);
            // eslint-disable-next-line no-unused-expressions
            channelPanelRef.current?.setAttribute('style', `max-height:${height}px;overflow:auto`);
        }
    }, [eventsPanelOpen, searchRecordsPanelOpen, recordTypePanelOpen, channelPanelRef, recordTypePanelRef, searchRecordsPanelRef, eventsPanelRef, resultPanelRef, apiError, apiResponseValid, suggestionChosen, successPanelOpen]);

    // Returns action handler for primary button in the result panel
    const getResultPanelPrimaryBtnActionOrText = useCallback((action: boolean) => {
        if (apiError && apiResponseValid) {
            return action ? resetFailureState : 'Back';
        } else if (subscriptionData) {
            return null;
        }
        return action ? addAnotherSubscription : 'Add Another Subscription';
    }, [apiError, apiResponseValid, subscriptionData, resetFailureState, addAnotherSubscription]);

    // Returns heading for the result panel
    const getResultPanelHeader = useCallback(() => {
        if (apiError && apiResponseValid) {
            return apiError;
        } else if (subscriptionData) {
            return 'Subscription updated successfully! ';
        }
        return null;
    }, [apiError, apiResponseValid, subscriptionData]);

    // Handles create subscription
    const createSubscription = () => {
        setApiError(null);

        // Create subscription payload
        const payload: CreateSubscriptionPayload = {
            server_url: SiteURL ?? '',
            is_active: true,
            user_id: Cookies.get(Constants.MMUSERID) ?? '',
            type: 'record',
            record_type: recordType as string,
            record_id: recordId as string,
            subscription_events: subscriptionEvents.join(','),
            channel_id: channel as string,
        };

        // Set payload
        setCreateSubscriptionPayload(payload);

        // Make API request for creating the subscription
        makeApiRequest(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, payload);
    };

    // Handles edit subscription
    const editSubscription = () => {
        setApiError(null);

        // Edit subscription payload
        const payload: EditSubscriptionPayload = {
            server_url: SiteURL ?? '',
            is_active: true,
            user_id: Cookies.get(Constants.MMUSERID) ?? '',
            type: 'record',
            record_type: recordType as string,
            record_id: recordId as string,
            subscription_events: subscriptionEvents.join(','),
            channel_id: channel as string,
            sys_id: subscriptionData?.id as string,
        };

        // Set payload
        setEditSubscriptionPayload(payload);

        // Make API request for editing the subscription
        makeApiRequest(Constants.pluginApiServiceConfigs.editSubscription.apiServiceName, payload);
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
                        ${recordTypePanelOpen && 'channel-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'channel-panel--fade-out'}
                    `}
                    ref={channelPanelRef}
                    onContinue={() => setRecordTypePanelOpen(true)}
                    channel={channel}
                    setChannel={setChannel}
                    setShowModalLoader={setShowModalLoader}
                    setApiError={setApiError}
                    setApiResponseValid={setApiResponseValid}
                    channelOptions={channelOptions}
                    setChannelOptions={setChannelOptions}
                />
                <RecordTypePanel
                    className={`
                        ${recordTypePanelOpen && 'secondary-panel--slide-in'}
                        ${(searchRecordsPanelOpen || eventsPanelOpen) && 'secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'secondary-panel--fade-out'}
                    `}
                    ref={recordTypePanelRef}
                    onContinue={() => setSearchRecordsPanelOpen(true)}
                    onBack={() => setRecordTypePanelOpen(false)}
                    recordType={recordType}
                    setRecordType={setRecordType}
                    setResetRecordPanelStates={setResetRecordPanelStates}
                />
                <SearchRecordsPanel
                    className={`
                        ${searchRecordsPanelOpen && 'secondary-panel--slide-in'}
                        ${eventsPanelOpen && 'secondary-panel--fade-out'}
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
                    recordType={recordType}
                    setApiError={setApiError}
                    setApiResponseValid={setApiResponseValid}
                    setShowModalLoader={setShowModalLoader}
                    recordId={recordId}
                    setRecordId={setRecordId}
                    resetStates={resetRecordPanelStates}
                />
                <EventsPanel
                    className={`
                        ${eventsPanelOpen && 'secondary-panel--slide-in'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'secondary-panel--fade-out'}
                    `}
                    ref={eventsPanelRef}
                    onContinue={subscriptionData ? editSubscription : createSubscription}
                    onBack={() => setEventsPanelOpen(false)}
                    subscriptionEvents={subscriptionEvents}
                    setSubscriptionEvents={setSubscriptionEvents}
                    channel={channelOptions.find((ch) => ch.value === channel) as DropdownOptionType || null}
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
