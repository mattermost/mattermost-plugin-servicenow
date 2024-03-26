import React, {createRef, useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-webapp/types/store';
import Cookies from 'js-cookie';

import {CustomModal as Modal, ModalHeader, ModalLoader, ResultPanel} from '@brightscout/mattermost-ui-library';

import Constants, {PanelDefaultHeights, SubscriptionEvents, SubscriptionType, RecordType} from 'src/plugin_constants';

import usePluginApi from 'src/hooks/usePluginApi';

import {setConnected} from 'src/reducers/connectedState';
import {refetch} from 'src/reducers/refetchState';

import Utils from 'src/utils';

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
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);

    // Subscription type panel values
    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType | null>(null);

    // Record panel values
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [resetRecordPanelStates, setResetRecordPanelStates] = useState(false);
    const [recordNumber, setRecordNumber] = useState('');

    // Record type panel
    const [recordType, setRecordType] = useState<RecordType | null>(null);

    // Opened panel states
    const [subscriptionTypePanelOpen, setSubscriptionTypePanelOpen] = useState(false);
    const [recordTypePanelOpen, setRecordTypePanelOpen] = useState(false);
    const [searchRecordsPanelOpen, setSearchRecordsPanelOpen] = useState(false);
    const [eventsPanelOpen, setEventsPanelOpen] = useState(false);
    const [successPanelOpen, setSuccessPanelOpen] = useState(false);

    // Events panel values
    const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvents[]>([]);

    // API error
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [apiResponseValid, setApiResponseValid] = useState(false);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // Create subscription payload
    const [createSubscriptionPayload, setCreateSubscriptionPayload] = useState<CreateSubscriptionPayload | null>(null);
    const siteUrl = useSelector(Utils.getSiteUrl);

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
        return {isLoading, isSuccess, isError, data: data as RecordData, error: apiErr};
    };

    // Get edit subscription state
    const getEditSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.editSubscription.apiServiceName, editSubscriptionPayload as EditSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: apiErr};
    };

    useEffect(() => {
        if (open && currentChannelId) {
            setChannel(currentChannelId);
        }

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
    }, [open, subscriptionData, currentChannelId]);

    useEffect(() => {
        const createSubscriptionState = getCreateSubscriptionState();

        if (createSubscriptionState.isLoading) {
            setApiResponseValid(true);
        }
        if (createSubscriptionState.isError && apiResponseValid && createSubscriptionState.error) {
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
        if (editSubscriptionState.isError && apiResponseValid && editSubscriptionState.error) {
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
        document.querySelectorAll('.servicenow-modal.add-edit-subscription-modal .modal-content').forEach((modalContent) => setHeight(modalContent));
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
            if (apiError.id === Constants.ApiErrorIdNotConnected || apiError.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
                return action ? hideModal : 'Close';
            }
            return action ? resetFailureState : 'Back';
        } else if (subscriptionData) {
            return null;
        }
        return action ? addAnotherSubscription : 'Add Another Subscription';
    }, [apiError, apiResponseValid, subscriptionData, resetFailureState, addAnotherSubscription]);

    // Returns heading for the result panel
    const getResultPanelHeader = useCallback(() => {
        if (apiError && apiResponseValid) {
            return Utils.getResultPanelHeader(apiError, hideModal, siteUrl);
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
            server_url: siteUrl ?? '',
            is_active: true,
            user_id: Cookies.get(Constants.MMUSERID) ?? '',
            type: subscriptionType as SubscriptionType,
            record_type: recordType as RecordType,
            record_id: recordId as string || '',
            subscription_events: subscriptionEvents.join(','),
            channel_id: channel as string,
            record_number: recordNumber,
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
            server_url: siteUrl ?? '',
            is_active: true,
            user_id: subscriptionData?.userId ?? '',
            type: subscriptionType as SubscriptionType,
            record_type: recordType as RecordType,
            record_id: recordId || '',
            subscription_events: subscriptionEvents.join(','),
            channel_id: channel as string,
            sys_id: subscriptionData?.id as string,
            record_number: recordNumber,
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
            className='servicenow-modal add-edit-subscription-modal wizard'
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
                        modal__body channel-panel wizard__primary-panel 
                        ${subscriptionTypePanelOpen && 'wizard__primary-panel--fade-out'}
                        ${(successPanelOpen || (apiResponseValid && apiError)) && 'wizard__primary-panel--fade-out'}
                    `}
                    ref={channelPanelRef}
                    onContinue={() => setSubscriptionTypePanelOpen(true)}
                    channel={channel}
                    setChannel={setChannel}
                    setApiError={setApiError}
                    setApiResponseValid={setApiResponseValid}
                    channelOptions={channelOptions}
                    setChannelOptions={setChannelOptions}
                    actionBtnDisabled={showModalLoader}
                    editing={true}
                    showFooter={true}
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
                        modal__body wizard__secondary-panel 
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
                    showFooter={true}
                    recordTypeOptions={Constants.recordTypeOptions}
                />
                <SearchRecordsPanel
                    className={`
                        modal__body search-panel wizard__secondary-panel 
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
                    showFooter={true}
                    setRecordNumber={setRecordNumber}
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
                    continueBtnDisabled={showModalLoader || !subscriptionEvents.length}
                    backBtnDisabled={showModalLoader}
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
                        onClick: apiError?.id === Constants.ApiErrorIdNotConnected || apiError?.id === Constants.ApiErrorIdRefreshTokenExpired ? null : hideModal,
                    }}
                />
            </>
        </Modal>
    );
};

export default AddOrEditSubscription;
