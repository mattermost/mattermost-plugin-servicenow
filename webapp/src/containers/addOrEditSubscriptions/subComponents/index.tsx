import React, {createRef, useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import Cookies from 'js-cookie';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {CustomModal as Modal, ModalHeader, ModalLoader, ResultPanel} from '@brightscout/mattermost-ui-library';

import Constants, {PanelDefaultHeights, SubscriptionEvents, SubscriptionType, RecordType} from 'plugin_constants';

import usePluginApi from 'hooks/usePluginApi';

import {refetch} from 'reducers/refetchSubscriptions';

import ChannelPanel from './channelPanel';
import SubscriptionTypePanel from './subscriptionTypePanel';
import RecordTypePanel from './recordTypePanel';
import EventsPanel from './eventsPanel';
import SearchRecordsPanel from './searchRecordsPanel';

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

    // Subscription type panel values
    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType | null>(null);

    // Record panel values
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [resetRecordPanelStates, setResetRecordPanelStates] = useState(false);

    // Record type panel
    const [recordType, setRecordType] = useState<null | RecordType>(null);

    // Opened panel states
    const [subscriptionTypePanelOpen, setSubscriptionTypePanelOpen] = useState(false);
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
    const {makeApiRequest, getApiState} = usePluginApi();

    // Create refs to access height of the panels and providing height to modal-dialog
    // We've made all the panels absolute positioned to apply animations and because they are absolute positioned, their parent container, which is modal-dialog, won't expand the same as their heights
    const channelPanelRef = createRef<HTMLDivElement>();
    const subscriptionTypePanelRef = createRef<HTMLDivElement>();
    const recordTypePanelRef = createRef<HTMLDivElement>();
    const searchRecordsPanelRef = createRef<HTMLDivElement>();
    const eventsPanelRef = createRef<HTMLDivElement>();
    const resultPanelRef = createRef<HTMLDivElement>();

    const dispatch = useDispatch();

    // Get create subscription state
    const getCreateSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, createSubscriptionPayload as CreateSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    // Get edit subscription state
    const getEditSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.editSubscription.apiServiceName, editSubscriptionPayload as EditSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    useEffect(() => {
        if (open && subscriptionData) {
            // Set values for channel panel
            setChannel(subscriptionData.channel);

            // Set initial values for subscription-type panel
            setSubscriptionType(subscriptionData.type);

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
        if (createSubscriptionState.isSuccess && apiResponseValid) {
            setSuccessPanelOpen(true);
            dispatch(refetch());
        }
        setShowModalLoader(createSubscriptionState.isLoading);
    }, [getCreateSubscriptionState().isLoading, getCreateSubscriptionState().isError, getCreateSubscriptionState().isSuccess, apiResponseValid]);

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
            dispatch(refetch());
        }
        setShowModalLoader(editSubscriptionState.isLoading);
    }, [getEditSubscriptionState().isLoading, getEditSubscriptionState().isError, getEditSubscriptionState().isSuccess]);

    // Reset input field states
    const resetFieldStates = useCallback(() => {
        setChannel(null);
        setSubscriptionType(null);
        setRecordValue('');
        setSuggestionChosen(false);
        setRecordType(null);
        setSubscriptionEvents([]);
    }, []);

    // Reset panel states
    const resetPanelStates = useCallback(() => {
        setSubscriptionTypePanelOpen(false);
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
            return;
        }
        if (eventsPanelOpen) {
            height = eventsPanelRef.current?.offsetHeight || PanelDefaultHeights.eventsPanel;

            setModalDialogHeight(height);
            return;
        }
        if (searchRecordsPanelOpen) {
            height = searchRecordsPanelRef.current?.offsetHeight || PanelDefaultHeights.searchRecordPanel;

            if (suggestionChosen && height < PanelDefaultHeights.searchRecordPanelExpanded) {
                height = PanelDefaultHeights.searchRecordPanelExpanded;
            }

            setModalDialogHeight(height);
            return;
        }
        if (recordTypePanelOpen) {
            height = recordTypePanelRef.current?.offsetHeight || PanelDefaultHeights.recordTypePanel;

            setModalDialogHeight(height);
            return;
        }
        if (subscriptionTypePanelOpen) {
            height = subscriptionTypePanelRef.current?.offsetHeight || PanelDefaultHeights.subscriptionTypePanel;

            setModalDialogHeight(height);
            return;
        }
        if (!subscriptionTypePanelOpen && !recordTypePanelOpen && !searchRecordsPanelOpen && !eventsPanelOpen) {
            height = channelPanelRef.current?.offsetHeight || PanelDefaultHeights.channelPanel;

            setModalDialogHeight(height);
        }
    }, [subscriptionTypePanelOpen, eventsPanelOpen, searchRecordsPanelOpen, recordTypePanelOpen, apiError, apiResponseValid, suggestionChosen, successPanelOpen]);

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
            return Constants.SubscriptionUpdatedMsg;
        }
        return Constants.SubscriptionAddedMsg;
    }, [apiError, apiResponseValid, subscriptionData]);

    // Handles create subscription
    const createSubscription = () => {
        setApiError(null);

        // Create subscription payload
        const payload: CreateSubscriptionPayload = {
            server_url: SiteURL ?? '',
            is_active: true,
            user_id: Cookies.get(Constants.MMUSERID) ?? '',
            type: subscriptionType as SubscriptionType,
            record_type: recordType as RecordType,
            record_id: recordId as string || '',
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
            type: subscriptionType as SubscriptionType,
            record_type: recordType as RecordType,
            record_id: recordId || '',
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
            className='rhs-modal add-edit-subscription-modal wizard'
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
                        ${subscriptionTypePanelOpen && 'wizard__primary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__primary-panel--fade-out'}
                    `}
                    ref={channelPanelRef}
                    onContinue={() => setSubscriptionTypePanelOpen(true)}
                    channel={channel}
                    setChannel={setChannel}
                    setShowModalLoader={setShowModalLoader}
                    setApiError={setApiError}
                    setApiResponseValid={setApiResponseValid}
                    channelOptions={channelOptions}
                    setChannelOptions={setChannelOptions}
                    actionBtnDisabled={showModalLoader}
                    editing={Boolean(subscriptionData)}
                />
                <SubscriptionTypePanel
                    className={`
                        ${subscriptionTypePanelOpen && 'wizard__secondary-panel--slide-in'}
                        ${(recordTypePanelOpen || searchRecordsPanelOpen || eventsPanelOpen) && 'wizard__secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__secondary-panel--fade-out'}
                    `}
                    ref={subscriptionTypePanelRef}
                    onContinue={() => setRecordTypePanelOpen(true)}
                    onBack={() => setSubscriptionTypePanelOpen(false)}
                    subscriptionType={subscriptionType}
                    setSubscriptionType={setSubscriptionType}
                />
                <RecordTypePanel
                    className={`
                        ${recordTypePanelOpen && 'wizard__secondary-panel--slide-in'}
                        ${(searchRecordsPanelOpen || eventsPanelOpen) && 'wizard__secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__secondary-panel--fade-out'}
                    `}
                    ref={recordTypePanelRef}
                    onContinue={() => (subscriptionType === SubscriptionType.RECORD ? setSearchRecordsPanelOpen(true) : setEventsPanelOpen(true))}
                    onBack={() => setRecordTypePanelOpen(false)}
                    recordType={recordType}
                    setRecordType={setRecordType}
                    setResetRecordPanelStates={setResetRecordPanelStates}
                />
                <SearchRecordsPanel
                    className={`
                        ${searchRecordsPanelOpen && 'wizard__secondary-panel--slide-in'}
                        ${eventsPanelOpen && 'wizard__secondary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__secondary-panel--fade-out'}
                    `}
                    ref={searchRecordsPanelRef}
                    onContinue={() => setEventsPanelOpen(true)}
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
                    setResetStates={setResetRecordPanelStates}
                />
                <EventsPanel
                    className={`
                        ${eventsPanelOpen && 'wizard__secondary-panel--slide-in'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__secondary-panel--fade-out'}
                    `}
                    ref={eventsPanelRef}
                    onContinue={subscriptionData ? editSubscription : createSubscription}
                    onBack={() => setEventsPanelOpen(false)}
                    subscriptionEvents={subscriptionEvents}
                    setSubscriptionEvents={setSubscriptionEvents}
                    channel={channelOptions.find((ch) => ch.value === channel) as DropdownOptionType || null}
                    subscriptionType={subscriptionType as SubscriptionType}
                    record={recordValue}
                    recordType={recordType as RecordType}
                    actionBtnDisabled={showModalLoader}
                />
                <ResultPanel
                    className={`${(successPanelOpen || (apiError && apiResponseValid)) && 'wizard__secondary-panel--slide-in'}`}
                    ref={resultPanelRef}
                    iconClass={apiError && apiResponseValid ? 'fa-times-circle-o result-panel-icon--error' : null}
                    header={getResultPanelHeader()}
                    primaryBtn={{
                        text: getResultPanelPrimaryBtnActionOrText(false) as string,
                        onClick: getResultPanelPrimaryBtnActionOrText(true) as (() => void) | null,
                    }}
                    secondaryBtn={{
                        text: 'Close',
                        onClick: hideModal,
                    }}
                />
            </>
        </Modal>
    );
};

export default AddOrEditSubscription;
