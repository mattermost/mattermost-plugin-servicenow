import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CustomModal as Modal, InputField as Input, Dropdown, ModalFooter, ModalHeader, TextArea, ToggleSwitch, ResultPanel, CircularLoader} from '@brightscout/mattermost-ui-library';

import {GlobalState} from 'mattermost-webapp/types/store';

import Cookies from 'js-cookie';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
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
    const [showModal, setShowModal] = useState(false);
    const [showChannelValidationError, setShowChannelValidationError] = useState<boolean>(false);

    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // usePluginApi hook
    const {pluginState, makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();
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
        setShowChannelValidationError(false);
    }, []);

    // Hide the modal and reset the states
    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        setShowModal(false);
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

    const getIncidentFieldsState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getIncidentFields.apiServiceName);
        return {isLoading, data: data as IncidentFieldsData[]};
    };

    const getIncidentState = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, incidentPayload);
        return {isLoading, data: data as RecordData};
    };

    const getSubscriptionState = () => {
        const {isLoading} = getApiState(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, subscriptionPayload);
        return {isLoading};
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

        if (impact) {
            payload.impact = parseInt(impact, 10);
        }

        if (urgency) {
            payload.urgency = parseInt(urgency, 10);
        }

        setIncidentPayload(payload);
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.createIncident.apiServiceName, payload);
    };

    const handleError = (error: APIError) => {
        if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
        }

        setApiError(error);
        setShowResultPanel(true);
    };

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getIncidentFields.apiServiceName,
        handleSuccess: () => Utils.getImpactAndUrgencyOptions(setImpactOptions, setUrgencyOptions, incidentFieldsData),
        handleError,
    });

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.createIncident.apiServiceName,
        payload: incidentPayload,
        handleSuccess: () => {
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
                record_id: createIncidentData.sys_id || '',
                subscription_events: subscriptionEvents.join(','),
                channel_id: channel ?? currentChannelId,
            };

            setSubscriptionPayload(payload);
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.createSubscription.apiServiceName, payload);
        },
        handleError,
    });

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.createSubscription.apiServiceName,
        payload: subscriptionPayload,
        handleSuccess: () => {
            setApiError(null);
            dispatch(refetch());
            setShowResultPanel(true);
        },
        handleError,
    });

    useEffect(() => {
        if (currentChannelId) {
            setChannel(currentChannelId);
        }

        if (open && pluginState.connectedReducer.connected) {
            setShowModal(true);
        } else {
            dispatch(resetGlobalModalState());
            return;
        }

        if (open && getGlobalModalState(pluginState).data) {
            const {description: reduxStateDescription} = getGlobalModalState(pluginState).data as IncidentModalData;
            setDescription(reduxStateDescription);
        }

        if (open && refetchIncidentFields) {
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getIncidentFields.apiServiceName);
            setRefetchIncidentFields(false);
        }
    }, [open, refetchIncidentFields]);

    useEffect(() => {
        if (channel) {
            setShowChannelValidationError(false);
        }
    }, [channel]);

    // Get services data
    const {isLoading: incidentFieldsLoading, data: incidentFieldsData} = getIncidentFieldsState();
    const {isLoading: createIncidentLoading, data: createIncidentData} = getIncidentState();
    const {isLoading: createSubscriptionLoading} = getSubscriptionState();
    const showLoader = incidentFieldsLoading || createIncidentLoading || createSubscriptionLoading;
    return (
        <Modal
            show={showModal}
            onHide={hideModal}
            className='servicenow-rhs-modal'
        >
            <>
                <ModalHeader
                    title='Create an incident'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {showLoader && <CircularLoader/>}
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
                                disabled={showLoader}
                            />
                            <TextArea
                                placeholder='Description'
                                value={description}
                                onChange={handleDescriptionChange}
                                className='incident-body__text-area'
                                disabled={showLoader}
                            />
                            <Dropdown
                                placeholder='Select impact'
                                value={impact}
                                onChange={setImpact}
                                options={impactOptions}
                                disabled={showLoader || !impactOptions.length}
                                className='margin-top-20'
                                loadingOptions={!impactOptions.length}
                            />
                            <Dropdown
                                placeholder='Select urgency'
                                value={urgency}
                                onChange={setUrgency}
                                options={urgencyOptions}
                                disabled={showLoader || !urgencyOptions.length}
                                className='margin-top-20'
                                loadingOptions={!urgencyOptions.length}
                            />
                            <CallerPanel
                                caller={caller}
                                setCaller={setCaller}
                                setApiError={setApiError}
                                showModalLoader={showLoader}
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
                                    showModalLoader={showLoader}
                                    setApiError={setApiError}
                                    channelOptions={channelOptions}
                                    setChannelOptions={setChannelOptions}
                                    actionBtnDisabled={showLoader}
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
                            confirmDisabled={showLoader}
                            onHide={hideModal}
                            cancelBtnText='Cancel'
                            cancelDisabled={showLoader}
                        />
                    </div>
                )}
            </>
        </Modal>
    );
};

export default CreateIncident;
