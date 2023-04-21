import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {CustomModal as Modal, InputField as Input, ModalFooter, ModalHeader, TextArea, ToggleSwitch, ResultPanel, CircularLoader} from '@brightscout/mattermost-ui-library';

import {GlobalState} from 'mattermost-webapp/types/store';

import Cookies from 'js-cookie';

import usePluginApi from 'src/hooks/usePluginApi';
import Constants, {RecordType, SubscriptionEvents, SubscriptionType} from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {refetch} from 'src/reducers/refetchState';
import {getGlobalModalState, isCreateIncidentModalOpen} from 'src/selectors';
import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import Utils from 'src/utils';

import CallerPanel from './callerPanel';

import './styles.scss';

const CreateIncident = () => {
    const [shortDescription, setShortDescription] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [caller, setCaller] = useState<string | null>(null);
    const [channel, setChannel] = useState<string | null>(null);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);
    const [showResultPanel, setShowResultPanel] = useState(false);
    const [incidentPayload, setIncidentPayload] = useState<IncidentPayload | null>(null);
    const [subscriptionPayload, setSubscriptionPayload] = useState<CreateSubscriptionPayload | null>(null);
    const [showChannelPanel, setShowChannelPanel] = useState(false);
    const [showChannelValidationError, setShowChannelValidationError] = useState<boolean>(false);
    const [senderId, setSenderId] = useState<string>('');

    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();
    const open = isCreateIncidentModalOpen(pluginState);

    // Errors
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const dispatch = useDispatch();

    // Reset the field states
    const resetFieldStates = useCallback(() => {
        setShortDescription('');
        setDescription('');
        setCaller(null);
        setChannelOptions([]);
        setApiError(null);
        setValidationError(null);
        setShowResultPanel(false);
        setIncidentPayload(null);
        setSubscriptionPayload(null);
        setShowChannelPanel(false);
        setShowChannelValidationError(false);
        setSenderId('');
    }, []);

    // Hide the modal and reset the states
    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        setTimeout(() => {
            resetFieldStates();
        });
    }, []);

    // Opens incident modal
    const handleOpenIncidentModal = useCallback(() => {
        resetFieldStates();
    }, []);

    const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShortDescription(e.target.value);
        setValidationError('');
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value);

    const getIncidentState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, incidentPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, subscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getResultPanelPrimaryBtnActionOrText = useCallback((action: boolean) => {
        if (apiError) {
            return action ? hideModal : 'Close';
        }

        return action ? handleOpenIncidentModal : 'Create another incident';
    }, [apiError]);

    const createIncident = () => {
        if (!shortDescription) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        if (!channel && showChannelPanel) {
            setShowChannelValidationError(true);
            return;
        }

        // Set the first impact and urgency values by default.
        const payload: IncidentPayload = {
            short_description: shortDescription,
            description,
            caller_id: caller ?? '',
            channel_id: channel ?? currentChannelId,
        };

        setIncidentPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, payload);
    };

    const handleError = (error: APIError) => {
        if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
        }

        setApiError(error);
        setShowResultPanel(true);
    };

    useEffect(() => {
        const {isLoading, isError, isSuccess, error, data} = getIncidentState();
        setShowModalLoader(isLoading);
        if (isError && error) {
            handleError(error);
        }

        if (isSuccess) {
            setApiError(null);
            if (!showChannelPanel) {
                setShowResultPanel(true);
                return;
            }

            const subscriptionEvents = [
                SubscriptionEvents.STATE,
                SubscriptionEvents.PRIORITY,
                SubscriptionEvents.COMMENTED,
                SubscriptionEvents.ASSIGNMENT_GROUP,
                SubscriptionEvents.ASSIGNED_TO,
            ];

            const payload: CreateSubscriptionPayload = {
                server_url: SiteURL ?? '',
                is_active: true,
                user_id: Cookies.get(Constants.MMUSERID) ?? '',
                type: SubscriptionType.RECORD,
                record_type: RecordType.INCIDENT,
                record_id: data.sys_id || '',
                subscription_events: subscriptionEvents.join(','),
                channel_id: channel ?? currentChannelId,
            };

            setSubscriptionPayload(payload);
            makeApiRequest(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, payload);
        }
    }, [getIncidentState().isError, getIncidentState().isSuccess, getIncidentState().isLoading]);

    useEffect(() => {
        if (subscriptionPayload) {
            const {isLoading, isError, isSuccess, error} = getSubscriptionState();
            setShowModalLoader(isLoading);
            if (isError && error) {
                handleError(error);
            }

            if (isSuccess) {
                setApiError(null);
                dispatch(refetch());
                setShowResultPanel(true);
            }
        }
    }, [getSubscriptionState().isError, getSubscriptionState().isSuccess, getSubscriptionState().isLoading]);

    useEffect(() => {
        if (currentChannelId) {
            setChannel(currentChannelId);
        }

        if (open && getGlobalModalState(pluginState).data) {
            const {description: reduxStateDescription, senderId: reduxSenderId} = getGlobalModalState(pluginState).data as IncidentModalData;
            setSenderId(reduxSenderId);
            if (reduxStateDescription.length > Constants.MaxShortDescriptionLimit) {
                setDescription(reduxStateDescription);
            } else if (reduxStateDescription.length > Constants.MaxShortDescriptionCharactersView) {
                setShortDescription(reduxStateDescription.slice(0, Constants.MaxShortDescriptionCharactersView) + '...');
            } else {
                setShortDescription(reduxStateDescription);
            }
        }
    }, [open]);

    useEffect(() => {
        if (channel) {
            setShowChannelValidationError(false);
        }
    }, [channel]);

    return (
        <Modal
            show={open}
            onHide={hideModal}
            className='servicenow-rhs-modal'
        >
            <>
                <ModalHeader
                    title='Create an incident'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {showModalLoader && <CircularLoader/>}
                {showResultPanel || apiError ? (
                    <ResultPanel
                        header={Utils.getResultPanelHeader(apiError, hideModal, Constants.IncidentCreatedMsg)}
                        className={`${(showResultPanel || apiError) && 'wizard__secondary-panel--slide-in result-panel'}`}
                        primaryBtn={{
                            text: getResultPanelPrimaryBtnActionOrText(false) as string,
                            onClick: getResultPanelPrimaryBtnActionOrText(true) as (() => void) | null,
                        }}
                        secondaryBtn={{
                            text: 'Close',
                            onClick: apiError ? null : hideModal,
                        }}
                        iconClass={apiError ? 'fa-times-circle-o result-panel-icon--error' : ''}
                    />
                ) : (
                    <div className='servicenow-incident'>
                        <div className='incident-body'>
                            <Input
                                placeholder='Short description'
                                value={shortDescription}
                                onChange={handleShortDescriptionChange}
                                error={validationError ?? ''}
                                className='incident-body__input-field'
                                required={true}
                                disabled={showModalLoader}
                            />
                            <TextArea
                                placeholder='Description'
                                value={description}
                                onChange={handleDescriptionChange}
                                className='incident-body__text-area'
                                disabled={showModalLoader}
                            />
                            <CallerPanel
                                caller={caller}
                                setCaller={setCaller}
                                senderId={senderId ?? ''}
                                setApiError={setApiError}
                                showModalLoader={showModalLoader}
                                className={`incident-body__auto-suggest ${caller && 'incident-body__suggestion-chosen'}`}
                            />
                            <ToggleSwitch
                                active={showChannelPanel}
                                onChange={setShowChannelPanel}
                                label={Constants.ChannelPanelToggleLabel}
                                labelPositioning='right'
                                className='incident-body__toggle-switch'
                            />
                            {showChannelPanel && (
                                <ChannelPanel
                                    channel={channel}
                                    setChannel={setChannel}
                                    showModalLoader={showModalLoader}
                                    setApiError={setApiError}
                                    channelOptions={channelOptions}
                                    setChannelOptions={setChannelOptions}
                                    actionBtnDisabled={showModalLoader}
                                    editing={true}
                                    validationError={showChannelValidationError}
                                    required={true}
                                    placeholder='Select channel to create subscription'
                                    className={`incident-body__auto-suggest ${channel && 'incident-body__suggestion-chosen'}`}
                                />
                            )}
                        </div>
                        <ModalFooter
                            onConfirm={createIncident}
                            confirmBtnText='Create'
                            confirmDisabled={showModalLoader}
                            onHide={hideModal}
                            cancelBtnText='Cancel'
                            cancelDisabled={showModalLoader}
                        />
                    </div>
                )}
            </>
        </Modal>
    );
};

export default CreateIncident;
