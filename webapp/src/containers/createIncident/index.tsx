import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CustomModal as Modal, InputField as Input, Dropdown, ModalFooter, ModalHeader, TextArea, ToggleSwitch, ResultPanel, CircularLoader} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

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
    const [showChannelPanel, setShowChannelPanel] = useState(false);
    const [refetchIncidentFields, setRefetchIncidentFields] = useState(true);
    const [impactOptions, setImpactOptions] = useState<DropdownOptionType[]>([]);
    const [urgencyOptions, setUrgencyOptions] = useState<DropdownOptionType[]>([]);

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
        setImpact(null);
        setUrgency(null);
        setCaller(null);
        setChannelOptions([]);
        setApiError(null);
        setValidationError(null);
        setShowResultPanel(false);
        setIncidentPayload(null);
        setSubscriptionPayload(null);
        setShowChannelPanel(false);
        setRefetchIncidentFields(true);
    }, []);

    // Hide the modal and reset the states
    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        setTimeout(() => {
            resetFieldStates();
        }, 500);
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

    const getIncidentFieldsData = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getIncidentFeilds.apiServiceName);
        return {isLoading, isSuccess, isError, data: data as IncidentFieldsData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getIncidentData = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, incidentPayload);
        return {isLoading, isSuccess, isError, data: data as RecordData, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

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

        // Set the first impact and urgency values by default.
        const payload: IncidentPayload = {
            short_description: shortDescription,
            description,
            impact: parseInt(impact ?? impactOptions[0].value, 10),
            urgency: parseInt(urgency ?? urgencyOptions[0].value, 10),
            caller_id: caller ?? '',
            channel_id: channel ?? currentChannelId,
        };

        setIncidentPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, payload);
    };

    useEffect(() => {
        const {isLoading, isError, isSuccess, error, data} = getIncidentFieldsData();
        setShowModalLoader(isLoading);
        if (isError && error) {
            setApiError(error);
            setShowResultPanel(true);
        }

        if (isSuccess) {
            Utils.getImpactAndUrgencyOptions(setImpactOptions, setUrgencyOptions, data);
        }
    }, [getIncidentFieldsData().isError, getIncidentFieldsData().isSuccess, getIncidentFieldsData().isLoading]);

    useEffect(() => {
        const {isLoading, isError, isSuccess, error, data} = getIncidentData();
        setShowModalLoader(isLoading);
        if (isError && error) {
            setApiError(error);
            setShowResultPanel(true);
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
        if (currentChannelId) {
            setChannel(currentChannelId);
        }

        if (open && getGlobalModalState(pluginState).data) {
            const {shortDescription: reduxStateShortDescription, description: reduxStateDescription} = getGlobalModalState(pluginState).data as IncidentModalData;
            setShortDescription(reduxStateShortDescription);
            setDescription(reduxStateDescription);
        }

        if (open && refetchIncidentFields) {
            makeApiRequest(Constants.pluginApiServiceConfigs.getIncidentFeilds.apiServiceName);
            setRefetchIncidentFields(false);
        }
    }, [open, refetchIncidentFields]);

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
                            <Dropdown
                                placeholder='Select impact'
                                value={impact}
                                onChange={setImpact}
                                options={impactOptions}
                                disabled={showModalLoader || !impactOptions.length}
                                className='margin-top-20'
                                loadingOptions={showModalLoader || !impactOptions.length}
                            />
                            <Dropdown
                                placeholder='Select urgency'
                                value={urgency}
                                onChange={setUrgency}
                                options={urgencyOptions}
                                disabled={showModalLoader || !urgencyOptions.length}
                                className='margin-top-20'
                                loadingOptions={showModalLoader || !urgencyOptions.length}
                            />
                            <CallerPanel
                                caller={caller}
                                setCaller={setCaller}
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
                                    setShowModalLoader={setShowModalLoader}
                                    setApiError={setApiError}
                                    channelOptions={channelOptions}
                                    setChannelOptions={setChannelOptions}
                                    actionBtnDisabled={showModalLoader}
                                    editing={true}
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
                    </>
                )}
            </>
        </Modal>
    );
};

export default UpdateState;
