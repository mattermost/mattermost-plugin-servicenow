import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalLoader, ModalSubtitleAndError, ResultPanel, TextArea} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {getGlobalModalState, isCommentModalOpen} from 'src/selectors';

import Utils from 'src/utils';

import './styles.scss';

const AddOrViewComments = () => {
    const [commentsData, setCommentsData] = useState<string>('');
    const [comments, setComments] = useState('');
    const [showModalLoader, setShowModalLoader] = useState(false);
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [showErrorPanel, setShowErrorPanel] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [refetch, setRefetch] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setCommentsData('');
        setComments('');
        setShowModalLoader(false);
        setApiError(null);
        setValidationError('');
        setRefetch(false);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        resetFieldStates();
    }, []);

    const getCommentsPayload = (): CommentsPayload => ({
        record_type: getGlobalModalState(pluginState).data?.recordType as RecordType,
        record_id: getGlobalModalState(pluginState).data?.recordId as string,
        comments,
    });

    const getCommentsState = () => {
        const payload = getCommentsPayload();
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, data: data as string, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const addCommentState = () => {
        const payload = getCommentsPayload();
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const addComment = () => {
        if (!comments) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        const payload = getCommentsPayload();
        makeApiRequest(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
    };

    const onChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValidationError('');
        setComments(e.target.value);
    };

    useEffect(() => {
        if (isCommentModalOpen(pluginState)) {
            const payload = getCommentsPayload();
            makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        }
    }, [isCommentModalOpen(pluginState)]);

    useEffect(() => {
        const {isLoading, isSuccess, error, data, isError} = getCommentsState();
        if (isSuccess) {
            setShowErrorPanel(false);
            setCommentsData(data);
        }

        if (isError && error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
            }

            setShowErrorPanel(true);
            setApiError(error);
        }

        if (isLoading) {
            setShowErrorPanel(false);
        }

        setShowModalLoader(isLoading);
    }, [getCommentsState().isLoading, getCommentsState().isError, getCommentsState().isSuccess]);

    useEffect(() => {
        const {isLoading, isSuccess, error} = addCommentState();
        if (isSuccess) {
            setComments('');
            setRefetch(true);
        }

        if (error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
                setShowErrorPanel(true);
            }
            setApiError(error);
        }

        setShowModalLoader(isLoading);
    }, [addCommentState().isLoading, addCommentState().isError, addCommentState().isSuccess]);

    // Fetch comments from the API when refetch is set
    useEffect(() => {
        if (refetch) {
            const payload = getCommentsPayload();
            makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
            setRefetch(false);
        }
    }, [refetch]);

    return (
        <Modal
            show={isCommentModalOpen(pluginState)}
            onHide={hideModal}
        >
            <>
                <ModalHeader
                    title='Add comments'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <ModalLoader loading={addCommentState().isLoading}/>
                {showModalLoader && !comments && <CircularLoader/>}
                {(showErrorPanel && apiError) ? (
                    <ResultPanel
                        header={Utils.getResultPanelHeader(apiError, hideModal)}
                        className='wizard__secondary-panel--slide-in result-panel'
                        primaryBtn={{
                            text: 'Close',
                            onClick: hideModal,
                        }}
                        iconClass='fa-times-circle-o result-panel-icon--error'
                    />
                ) : (
                    <>
                        <div
                            className={`comment-body
                                    ${((!commentsData.length || apiError) && !showModalLoader) && 'comment-body__height'}`}
                        >
                            <TextArea
                                placeholder='Write new comment here'
                                value={comments}
                                onChange={onChangeHandle}
                                className='comment-body__text-area'
                                disabled={showModalLoader}
                                error={validationError}
                            />
                            {!apiError && <h4 className='comment-body__heading'>{Constants.CommentsHeading}</h4>}
                            {commentsData ? (
                                <>
                                    <div className='comment-body__description-text'>{commentsData}</div>
                                    <p className='comment-body__footer'>{Constants.NoCommentsPresent}</p>
                                </>
                            ) : (
                                !showModalLoader && <p className='comment-body__footer'>{Constants.CommentsNotFound}</p>
                            )}
                        </div>
                        <ModalSubtitleAndError error={apiError?.message}/>
                        <ModalFooter
                            onConfirm={addComment}
                            confirmBtnText='Submit'
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

export default AddOrViewComments;
