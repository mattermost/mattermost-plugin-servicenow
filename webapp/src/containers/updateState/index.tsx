import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, ResultPanel} from '@brightscout/mattermost-ui-library';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {getGlobalModalState, isUpdateStateModalOpen} from 'src/selectors';

import Utils from 'src/utils';

const UpdateState = () => {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [getStatesParams, setGetStatesParams] = useState<GetStatesParams | null>(null);
    const [updateStatePayload, setUpdateStatePayload] = useState<UpdateStatePayload | null>(null);
    const [showResultPanel, setShowResultPanel] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();

    // API error
    const [apiError, setApiError] = useState<APIError | null>(null);

    const dispatch = useDispatch();

    const resetStates = useCallback(() => {
        setSelectedState(null);
        setGetStatesParams(null);
        setUpdateStatePayload(null);
        setApiError(null);
        setShowResultPanel(false);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        resetStates();
    }, []);

    const getStateForGetStatesAPI = () => {
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getStates.apiServiceName, getStatesParams as GetStatesParams);
        return {isLoading, data: data as StateData[]};
    };

    const getStateForUpdateStateAPI = () => {
        const {isLoading} = getApiState(Constants.pluginApiServiceConfigs.updateState.apiServiceName, updateStatePayload as UpdateStatePayload);
        return {isLoading};
    };

    useEffect(() => {
        const {data} = getGlobalModalState(pluginState);
        if (isUpdateStateModalOpen(pluginState) && data?.recordType && data?.recordId) {
            const params: GetStatesParams = {recordType: data.recordType};
            setGetStatesParams(params);
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getStates.apiServiceName, params);
        }
    }, [isUpdateStateModalOpen(pluginState)]);

    const updateState = () => {
        const {data} = getGlobalModalState(pluginState);
        if (data) {
            const {recordType, recordId} = data;
            const payload: UpdateStatePayload = {recordType, recordId, state: selectedState ?? ''};
            setUpdateStatePayload(payload);
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.updateState.apiServiceName, payload);
        }
    };

    const handleError = (error: APIError) => {
        if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
        }

        setApiError(error);
        setShowResultPanel(true);
    };

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getStates.apiServiceName,
        payload: getStatesParams,
        handleSuccess: () => setApiError(null),
        handleError: (error) => handleError(error),
    });

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.updateState.apiServiceName,
        payload: updateStatePayload,
        handleSuccess: () => {
            setApiError(null);
            setShowResultPanel(true);
        },
        handleError: (error) => handleError(error),
    });

    const {isLoading: statesLoading, data: stateOptions} = getStateForGetStatesAPI();
    const {isLoading: stateUpdating} = getStateForUpdateStateAPI();
    const showLoader = statesLoading || stateUpdating;
    return (
        <Modal
            show={isUpdateStateModalOpen(pluginState)}
            onHide={hideModal}
            className='rhs-modal'
        >
            <>
                <ModalHeader
                    title='Update State'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {showLoader && <CircularLoader/>}
                {showResultPanel ? (
                    <ResultPanel
                        className='wizard__secondary-panel--slide-in result-panel'
                        header={Utils.getResultPanelHeader(apiError, hideModal, Constants.StateUpdatedMsg)}
                        primaryBtn={{
                            text: 'Close',
                            onClick: hideModal,
                        }}
                        iconClass={apiError && 'fa-times-circle-o result-panel-icon--error'}
                    />
                ) : (
                    <>
                        <div className='padding-h-12 padding-v-20 wizard__body-container'>
                            <Dropdown
                                placeholder='Select State'
                                value={selectedState}
                                onChange={setSelectedState}
                                options={stateOptions ?? []}
                                required={true}
                            />
                        </div>
                        <ModalFooter
                            onConfirm={updateState}
                            confirmBtnText='Update'
                            confirmDisabled={showLoader || !selectedState}
                            onHide={hideModal}
                            cancelDisabled={showLoader}
                        />
                    </>
                )}
            </>
        </Modal>
    );
};

export default UpdateState;
