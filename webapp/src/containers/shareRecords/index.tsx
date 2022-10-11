import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CustomModal as Modal, ModalFooter, ModalHeader, ModalSubtitleAndError} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'hooks/usePluginApi';

import Constants, {RecordType, RecordTypeLabelMap} from 'plugin_constants';

import {hideModal as hideRecordModal} from 'reducers/shareRecordModal';
import RecordTypePanel from 'containers/addOrEditSubscriptions/subComponents/recordTypePanel';
import SearchRecordsPanel from 'containers/addOrEditSubscriptions/subComponents/searchRecordsPanel';
import ChannelPanel from 'containers/addOrEditSubscriptions/subComponents/channelPanel';

const recordTypeOptions: DropdownOptionType[] = [
    {
        label: RecordTypeLabelMap[RecordType.INCIDENT],
        value: RecordType.INCIDENT,
    },
    {
        label: RecordTypeLabelMap[RecordType.PROBLEM],
        value: RecordType.PROBLEM,
    },
    {
        label: RecordTypeLabelMap[RecordType.CHANGE_REQUEST],
        value: RecordType.CHANGE_REQUEST,
    },
    {
        label: RecordTypeLabelMap[RecordType.KNOWLEDGE],
        value: RecordType.KNOWLEDGE,
    },
    {
        label: RecordTypeLabelMap[RecordType.TASK],
        value: RecordType.TASK,
    },
    {
        label: RecordTypeLabelMap[RecordType.CHANGE_TASK],
        value: RecordType.CHANGE_TASK,
    },
    {
        label: RecordTypeLabelMap[RecordType.FOLLOW_ON_TASK],
        value: RecordType.FOLLOW_ON_TASK,
    },
];

const ShareRecords = () => {
    // Record states
    const [recordType, setRecordType] = useState<null | RecordType>(null);
    const [recordValue, setRecordValue] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [resetRecordPanelStates, setResetRecordPanelStates] = useState(false);
    const [channel, setChannel] = useState<string | null>(null);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>([]);
    const [error, setError] = useState<boolean>(false);
    const [shareRecordPayload, setShareRecordPayload] = useState<ShareRecordPayload | null >(null);
    const [recordData, setRecordData] = useState<RecordData | null>(null);

    // API error
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiResponseValid, setApiResponseValid] = useState(false);

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
        setChannel(null);
        setChannelOptions([]);
        setError(false);
        setApiError(null);
        setApiResponseValid(false);
        setShowModalLoader(false);
        setShareRecordPayload(null);
        setRecordData(null);
    }, []);

    const hideModal = useCallback(() => {
        resetFieldStates();
        dispatch(hideRecordModal());
    }, []);

    const getShareRecordState = () => {
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.shareRecord.apiServiceName, shareRecordPayload as ShareRecordPayload);
        return {isLoading, isSuccess, isError, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    useEffect(() => {
        const shareRecordState = getShareRecordState();
        if (shareRecordState.isError) {
            setApiError(shareRecordState.error);
        }

        if (shareRecordState.isSuccess) {
            hideModal();
        }

        setShowModalLoader(shareRecordState.isLoading);
    }, [getShareRecordState().isLoading, getShareRecordState().isError, getShareRecordState().isSuccess]);

    const shareRecord = () => {
        if (!channel) {
            setError(true);
            return;
        }

        const payload: ShareRecordPayload = {
            channel_id: channel,
            record_type: recordType as RecordType,
            record_id: recordId || '',
            assigned_to: recordData?.assigned_to || '',
            assignment_group: recordData?.assignment_group || '',
            priority: recordData?.priority || '',
            short_description: recordData?.short_description || '',
            state: recordData?.state || '',
            author: recordData?.author || '',
            kb_category: recordData?.kb_category || '',
            kb_knowledge_base: recordData?.kb_knowledge_base || '',
            workflow_state: recordData?.workflow_state || '',
        };

        setShareRecordPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.shareRecord.apiServiceName, payload);
    };

    useEffect(() => {
        if (channel || !suggestionChosen) {
            setError(false);
        }

        if (!suggestionChosen) {
            setChannel(null);
        }
    }, [channel, suggestionChosen]);

    return (
        <Modal
            show={pluginState.openShareRecordModalReducer.open}
            onHide={hideModal}
            className={'rhs-modal'}
        >
            <>
                <ModalHeader
                    title={'Share a record'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <RecordTypePanel
                    recordType={recordType}
                    setRecordType={setRecordType}
                    setResetRecordPanelStates={setResetRecordPanelStates}
                    placeholder={'Record Type'}
                    recordTypeOptions={recordTypeOptions}
                />
                <SearchRecordsPanel
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
                    setRecordData={setRecordData}
                    disabled={!recordType}
                />
                {suggestionChosen && (
                    <ChannelPanel
                        channel={channel}
                        setChannel={setChannel}
                        setShowModalLoader={setShowModalLoader}
                        setApiError={setApiError}
                        setApiResponseValid={setApiResponseValid}
                        channelOptions={channelOptions}
                        setChannelOptions={setChannelOptions}
                        actionBtnDisabled={showModalLoader}
                        placeholder={'Search Channel to share'}
                        validationError={error}
                    />
                )}
                <ModalSubtitleAndError error={apiError ?? ''}/>
                <ModalFooter
                    onConfirm={suggestionChosen ? shareRecord : null}
                    confirmBtnText={'Share'}
                    confirmDisabled={showModalLoader}
                    onHide={hideModal}
                    cancelBtnText={'Cancel'}
                    cancelDisabled={showModalLoader}
                />
            </>
        </Modal>
    );
};

export default ShareRecords;
