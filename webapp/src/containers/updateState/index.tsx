import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {CircularLoader, CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, ResultPanel} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {hideModal as hideUpdateStateModal} from 'reducers/updateStateModal';

import './styles.scss';

const UpdateState = () => {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [getStatesParams, setGetStatesParams] = useState<GetStatesParams | null>(null);
    const [updateStatePayload, setUpdateStatePayload] = useState<UpdateStatePayload | null>(null);
    const [showResultPanel, setShowResultPanel] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    // API error
    const [apiError, setApiError] = useState('');

    const dispatch = useDispatch();

    const resetStates = useCallback(() => {
        setSelectedState(null);
        setGetStatesParams(null);
        setUpdateStatePayload(null);
        setApiError('');
        setShowResultPanel(false);
    }, []);

    const hideModal = useCallback(() => {
        resetStates();
        dispatch(hideUpdateStateModal());
    }, []);

    const getStateForGetStatesAPI = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getStates.apiServiceName, getStatesParams as GetStatesParams);
        return {isLoading, isSuccess, isError, data: data as StateData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getStateForUpdateStateAPI = () => {
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.updateState.apiServiceName, updateStatePayload as UpdateStatePayload);
        return {isLoading, isSuccess, isError, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    useEffect(() => {
        const {data, open} = pluginState.openUpdateStateModalReducer;
        if (!(open && data?.recordType && data?.recordId)) {
            return;
        }

        const params: GetStatesParams = {recordType: data.recordType};
        setGetStatesParams(params);
        makeApiRequest(Constants.pluginApiServiceConfigs.getStates.apiServiceName, params);
    }, [pluginState.openUpdateStateModalReducer.open]);

    const updateState = () => {
        const {recordType, recordId} = pluginState.openUpdateStateModalReducer.data;
        const payload: UpdateStatePayload = {recordType, recordId, state: selectedState ?? ''};
        setUpdateStatePayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.updateState.apiServiceName, payload);
    };

    useEffect(() => {
        const {isError, isSuccess, error} = getStateForUpdateStateAPI();
        if (isError) {
            setApiError(error?.message ?? '');
            setShowResultPanel(true);
        }

        if (isSuccess) {
            setApiError('');
            setShowResultPanel(true);
        }
    }, [getStateForUpdateStateAPI().isError, getStateForUpdateStateAPI().isSuccess]);

    useEffect(() => {
        const {isError, isSuccess, error} = getStateForGetStatesAPI();
        if (isError) {
            setApiError(error?.message ?? '');
            setShowResultPanel(true);
        }

        if (isSuccess) {
            setApiError('');
        }
    }, [getStateForGetStatesAPI().isError, getStateForGetStatesAPI().isSuccess]);

    const {isLoading: statesLoading, data: stateOptions} = getStateForGetStatesAPI();
    const {isLoading: stateUpdating} = getStateForUpdateStateAPI();
    const showLoader = statesLoading || stateUpdating;
    return (
        <Modal
            show={pluginState.openUpdateStateModalReducer.open}
            onHide={hideModal}
            className={'rhs-modal update-state-modal wizard'}
        >
            <>
                <ModalHeader
                    title={'Update State'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {showLoader && <CircularLoader/>}
                {showResultPanel ? (
                    <ResultPanel
                        header={apiError || 'State updated successfully'}
                        primaryBtn={{
                            text: 'Close',
                            onClick: hideModal,
                        }}
                        iconClass={apiError ? 'fa-times-circle-o result-panel-icon--error' : ''}
                    />
                ) : (
                    <>
                        <div className={'padding-h-12 padding-v-20 wizard__body-container'}>
                            <Dropdown
                                placeholder={'Select State'}
                                value={selectedState}
                                onChange={setSelectedState}
                                options={stateOptions ?? []}
                                required={true}
                            />
                        </div>
                        <ModalFooter
                            onConfirm={updateState}
                            confirmBtnText={'Update'}
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
