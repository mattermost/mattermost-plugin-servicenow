import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CircularLoader, CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, ResultPanel} from '@brightscout/mattermost-ui-library';

import {GlobalState} from 'mattermost-webapp/types/store';

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
    const {SiteURL} = useSelector((state: GlobalState) => state.entities.general.config);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

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
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getStates.apiServiceName, getStatesParams as GetStatesParams);
        return {isLoading, isSuccess, isError, data: data as StateData[], error: apiErr};
    };

    const getStateForUpdateStateAPI = () => {
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.updateState.apiServiceName, updateStatePayload as UpdateStatePayload);
        return {isLoading, isSuccess, isError, error: apiErr};
    };

    useEffect(() => {
        const data = getGlobalModalState(pluginState).data as CommentAndStateModalData;
        if (isUpdateStateModalOpen(pluginState) && data?.recordType && data?.recordId) {
            const params: GetStatesParams = {recordType: data.recordType};
            setGetStatesParams(params);
            makeApiRequest(Constants.pluginApiServiceConfigs.getStates.apiServiceName, params);
        }
    }, [isUpdateStateModalOpen(pluginState)]);

    const updateState = () => {
        const data = getGlobalModalState(pluginState).data as CommentAndStateModalData;
        if (data) {
            const {recordType, recordId} = data;
            const payload: UpdateStatePayload = {recordType, recordId, state: selectedState ?? ''};
            setUpdateStatePayload(payload);
            makeApiRequest(Constants.pluginApiServiceConfigs.updateState.apiServiceName, payload);
        }
    };

    useEffect(() => {
        // TODO: Add the use of "useApiRequestCompletionState" by taking reference from Azure DevOps plugin
        const {isError, isSuccess, error} = getStateForUpdateStateAPI();
        if (isError && error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
            }
            setApiError(error);
            setShowResultPanel(true);
        }

        if (isSuccess) {
            setApiError(null);
            setShowResultPanel(true);
        }
    }, [getStateForUpdateStateAPI().isError, getStateForUpdateStateAPI().isSuccess]);

    useEffect(() => {
        const {isError, isSuccess, error} = getStateForGetStatesAPI();
        if (isError && error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
            }
            setApiError(error);
            setShowResultPanel(true);
        }

        if (isSuccess) {
            setApiError(null);
        }
    }, [getStateForGetStatesAPI().isError, getStateForGetStatesAPI().isSuccess]);

    const {isLoading: statesLoading, data: stateOptions} = getStateForGetStatesAPI();
    const {isLoading: stateUpdating} = getStateForUpdateStateAPI();
    const showLoader = statesLoading || stateUpdating;
    return (
        <Modal
            show={isUpdateStateModalOpen(pluginState)}
            onHide={hideModal}
            className='servicenow-modal'
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
                        header={Utils.getResultPanelHeader(apiError, hideModal, SiteURL, Constants.StateUpdatedMsg)}
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
