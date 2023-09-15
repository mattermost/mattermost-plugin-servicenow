import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {GlobalState} from 'mattermost-webapp/types/store';

import {CustomModal as Modal, ModalFooter, ModalHeader, ModalLoader, ResultPanel} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import RecordTypePanel from 'src/containers/addOrEditSubscriptions/subComponents/recordTypePanel';
import SearchRecordsPanel from 'src/containers/addOrEditSubscriptions/subComponents/searchRecordsPanel';
import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {isShareRecordModalOpen} from 'src/selectors';

import Utils from 'src/utils';

const ShareRecords = () => {
    // Record states
    const [recordType, setRecordType] = useState<RecordType | null>(null);
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [resetRecordPanelStates, setResetRecordPanelStates] = useState(false);
    const [channel, setChannel] = useState<string | null>(null);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);
    const [showChannelValidationError, setShowChannelValidationError] = useState<boolean>(false);
    const [shareRecordPayload, setShareRecordPayload] = useState<ShareRecordPayload | null>(null);
    const [recordData, setRecordData] = useState<RecordData | null>(null);
    const [showResultPanel, setShowResultPanel] = useState(false);
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const siteUrl = useSelector(Utils.getSiteUrl);

    // API error
    const [apiError, setApiError] = useState<APIError | null>(null);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setRecordType(null);
        setRecordValue('');
        setRecordId(null);
        setSuggestionChosen(false);
        setResetRecordPanelStates(false);
        setChannelOptions([]);
        setShowChannelValidationError(false);
        setApiError(null);
        setShowModalLoader(false);
        setShareRecordPayload(null);
        setRecordData(null);
        setShowResultPanel(false);
    }, []);

    const hideModal = useCallback(() => {
        resetFieldStates();
        dispatch(resetGlobalModalState());
    }, []);

    // Opens share record modal
    const handleOpenShareRecordModal = useCallback(() => {
        resetFieldStates();
    }, []);

    const getShareRecordState = () => {
        const {isLoading, isSuccess, isError, error} = getApiState(Constants.pluginApiServiceConfigs.shareRecord.apiServiceName, shareRecordPayload as ShareRecordPayload);
        return {isLoading, isSuccess, isError, error};
    };

    useEffect(() => {
        const shareRecordState = getShareRecordState();
        if (shareRecordState.isError && shareRecordState.error) {
            setApiError(shareRecordState.error);
        }

        if (shareRecordState.isSuccess) {
            setShowResultPanel(true);
        }

        setShowModalLoader(shareRecordState.isLoading);
    }, [getShareRecordState().isLoading, getShareRecordState().isError, getShareRecordState().isSuccess]);

    const shareRecord = () => {
        if (!channel) {
            setShowChannelValidationError(true);
            return;
        }

        const payload: ShareRecordPayload = {
            channel_id: channel,
            record_type: recordType as RecordType,
            sys_id: recordId || '',
        };

        setShareRecordPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.shareRecord.apiServiceName, payload);
    };

    // Remove validation error
    useEffect(() => {
        if (channel || !suggestionChosen) {
            setShowChannelValidationError(false);
        }
    }, [channel, suggestionChosen]);

    // Set the channel when button is clicked
    useEffect(() => {
        if (currentChannelId) {
            setChannel(currentChannelId);
        }
    }, [currentChannelId, isShareRecordModalOpen(pluginState)]);

    const getResultPanelPrimaryBtnActionOrText = useCallback((action: boolean) => {
        if (apiError?.id === Constants.ApiErrorIdNotConnected || apiError?.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
            return action ? hideModal : 'Close';
        }
        return action ? handleOpenShareRecordModal : 'Share another record';
    }, [apiError]);

    return (
        <Modal
            show={isShareRecordModalOpen(pluginState)}
            onHide={hideModal}
            className='servicenow-modal'
        >
            <>
                <ModalHeader
                    title='Share a record'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <ModalLoader loading={getShareRecordState().isLoading}/>
                {showResultPanel || apiError ? (
                    <ResultPanel
                        header={Utils.getResultPanelHeader(apiError, hideModal, siteUrl, Constants.RecordSharedMsg)}
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
                        <RecordTypePanel
                            recordType={recordType}
                            setRecordType={setRecordType}
                            setResetRecordPanelStates={setResetRecordPanelStates}
                            placeholder='Record Type'
                            recordTypeOptions={Constants.shareRecordTypeOptions}
                        />
                        <SearchRecordsPanel
                            recordValue={recordValue}
                            setRecordValue={setRecordValue}
                            suggestionChosen={suggestionChosen}
                            setSuggestionChosen={setSuggestionChosen}
                            recordType={recordType}
                            setApiError={setApiError}
                            setShowModalLoader={setShowModalLoader}
                            recordId={recordId}
                            setRecordId={setRecordId}
                            resetStates={resetRecordPanelStates}
                            setResetStates={setResetRecordPanelStates}
                            setRecordData={setRecordData}
                            disabled={!recordType}
                        />
                        {suggestionChosen && (
                            <ChannelPanel
                                channel={channel}
                                setChannel={setChannel}
                                showModalLoader={getShareRecordState().isLoading}
                                setApiError={setApiError}
                                channelOptions={channelOptions}
                                setChannelOptions={setChannelOptions}
                                actionBtnDisabled={showModalLoader}
                                placeholder='Search channel to share'
                                validationError={showChannelValidationError}
                                editing={true}
                                required={true}
                            />
                        )}
                        <ModalFooter
                            onConfirm={recordData?.sys_id ? shareRecord : null}
                            confirmBtnText='Share'
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

export default ShareRecords;
