import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CircularLoader, CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, ResultPanel, TextArea} from '@brightscout/mattermost-ui-library';

import Input from '@brightscout/mattermost-ui-library/build/cjs/components/InputField';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {GlobalState} from 'mattermost-webapp/types/store';

import Cookies from 'js-cookie';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants, {IncidentImpactAndUrgencyOptions, RecordType, SubscriptionEvents, SubscriptionType} from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {refetch} from 'src/reducers/refetchState';
import {getGlobalModalState, isCreateIncidentModalOpen} from 'src/selectors';

import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import Utils from 'src/utils';

import CallerPanel from './callerPanel';

import './styles.scss';

const UpdateState = () => {
    const [shortDescription, setShortDescription] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [impact, setImpact] = useState<string | null>(null);
    const [urgency, setUrgency] = useState<string | null>(null);
    const [caller, setCaller] = useState<string | null>(null);
    const [channel, setChannel] = useState<string | null>(null);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);
    const [showResultPanel, setShowResultPanel] = useState(false);
    const [incidentPayload, setIncidentPayload] = useState<IncidentPayload | null>(null);
    const [subscriptionPayload, setSubscriptionPayload] = useState<CreateSubscriptionPayload | null>(null);

    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    // Errors
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const dispatch = useDispatch();
    const open = isCreateIncidentModalOpen(pluginState);

    // Reset the field states
    const resetFieldStates = useCallback(() => {
        setShortDescription('');
        setDescription('');
        setImpact(null);
        setUrgency(null);
        setCaller(null);
        setChannel(null);
        setChannelOptions([]);
        setApiError(null);
        setValidationError(null);
        setShowResultPanel(false);
        setIncidentPayload(null);
        setSubscriptionPayload(null);
    }, []);

    // Hide the modal and reset the states
    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        resetFieldStates();
    }, []);

    // Opens incident modal
    const handleOpenIncidentModal = useCallback(() => {
        resetFieldStates();
    }, []);

    const onShortDescriptionChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShortDescription(e.target.value);
        setValidationError('');
    };

    const onDescriptionChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    // Get incident state
    const getIncidentData = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, incidentPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    // Get subscription state
    const getSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, subscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getResultPanelPrimaryBtnActionOrText = useCallback((action: boolean) => {
        if (apiError?.id === Constants.ApiErrorIdNotConnected || apiError?.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
            return action ? hideModal : 'Close';
        }

        return action ? handleOpenIncidentModal : 'Create another incident';
    }, [apiError]);

    const createIncident = () => {
        if (!shortDescription) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        // Set lowest impact and urgency by default.
        const payload: IncidentPayload = {
            short_description: shortDescription,
            description,
            impact: parseInt(impact ?? '3', 10),
            urgency: parseInt(urgency ?? '3', 10),
            caller_id: caller ?? '',
            channel_id: channel ?? currentChannelId,
        };

        setIncidentPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, payload);
    };

    useEffect(() => {
        const {isLoading, isError, isSuccess, error, data} = getIncidentData();
        setShowModalLoader(isLoading);
        if (isError && error) {
            setApiError(error);
            setShowResultPanel(true);
        }

        if (isSuccess) {
            setApiError(null);
            if (!channel) {
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
                channel_id: channel,
            };

            setSubscriptionPayload(payload);
            makeApiRequest(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, payload);
        }
    }, [getIncidentData().isError, getIncidentData().isSuccess, getIncidentData().isLoading]);

    useEffect(() => {
        if (subscriptionPayload) {
            const {isLoading, isError, isSuccess, error} = getSubscriptionState();
            setShowModalLoader(isLoading);
            if (isError && error) {
                setApiError(error);
                setShowResultPanel(true);
            }

            if (isSuccess) {
                setApiError(null);
                dispatch(refetch());
                setShowResultPanel(true);
            }
        }
    }, [getSubscriptionState().isError, getSubscriptionState().isSuccess, getSubscriptionState().isLoading]);

    useEffect(() => {
        if (open && getGlobalModalState(pluginState).data) {
            const {shortDescription: reduxStateShortDescription, description: reduxStateDescription} = getGlobalModalState(pluginState).data as IncidentModalData;
            setShortDescription(reduxStateShortDescription);
            setDescription(reduxStateDescription);
        }
    }, [open]);

    return (
        <Modal
            show={open}
            onHide={hideModal}
            className='rhs-modal'
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
                            onClick: apiError?.id === Constants.ApiErrorIdNotConnected || apiError?.id === Constants.ApiErrorIdRefreshTokenExpired ? null : hideModal,
                        }}
                        iconClass={apiError ? 'fa-times-circle-o result-panel-icon--error' : ''}
                    />
                ) : (
                    <>
                        <div className='incident-body'>
                            <Input
                                placeholder='Short description'
                                value={shortDescription}
                                onChange={onShortDescriptionChangeHandle}
                                error={validationError ?? ''}
                                disabled={showModalLoader}
                                className='incident-body__input-field'
                            />
                            <TextArea
                                placeholder='Description'
                                value={description}
                                onChange={onDescriptionChangeHandle}
                                className='incident-body__text-area'
                                disabled={showModalLoader}
                            />
                            <Dropdown
                                placeholder='Select impact'
                                value={impact}
                                onChange={setImpact}
                                options={IncidentImpactAndUrgencyOptions}
                                disabled={showModalLoader}
                                className='margin-top-20'
                            />
                            <Dropdown
                                placeholder='Select urgency'
                                value={urgency}
                                onChange={setUrgency}
                                options={IncidentImpactAndUrgencyOptions}
                                disabled={showModalLoader}
                                className='margin-top-20'
                            />
                            <CallerPanel
                                caller={caller}
                                setCaller={setCaller}
                                showModalLoader={showModalLoader}
                                setShowModalLoader={setShowModalLoader}
                                setApiError={setApiError}
                                className='incident-body__auto-suggest'
                            />
                            <ChannelPanel
                                channel={channel}
                                setChannel={setChannel}
                                showModalLoader={showModalLoader}
                                setShowModalLoader={setShowModalLoader}
                                setApiError={setApiError}
                                channelOptions={channelOptions}
                                setChannelOptions={setChannelOptions}
                                actionBtnDisabled={showModalLoader}
                                placeholder='Select channel to create subscription'
                                className='incident-body__auto-suggest'
                            />
                        </div>
                        <ModalFooter
                            onConfirm={createIncident}
                            confirmBtnText='Create'
                            confirmDisabled={showModalLoader}
                            onHide={hideModal}
                            cancelBtnText='Cancel'
                            cancelDisabled={showModalLoader}
                        />
                    </>
                )}
            </>
        </Modal>
    );
};

export default UpdateState;
