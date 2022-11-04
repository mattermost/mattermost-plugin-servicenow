import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalLoader, ModalSubtitleAndError, ResultPanel, TextArea, Button} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'hooks/usePluginApi';

import Constants, {CONNECT_ACCOUNT_LINK} from 'plugin_constants';

import {hideModal as hideCommentModal} from 'reducers/commentModal';
import Utils from 'utils';
import {setConnected} from 'reducers/connectedState';

import './styles.scss';

const AddOrViewComments = () => {
    const [commentsData, setCommentsData] = useState<string>('');
    const [comments, setComments] = useState('');
    const [showModalLoader, setShowModalLoader] = useState(false);
    const [apiError, setApiError] = useState('');
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
        setApiError('');
        setValidationError('');
        setRefetch(false);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(hideCommentModal());
        resetFieldStates();
    }, []);

    const getCommentsPayload = (): CommentsPayload => ({
        record_type: pluginState.openCommentModalReducer.data?.recordType,
        record_id: pluginState.openCommentModalReducer.data?.recordId,
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
        if (pluginState.openCommentModalReducer.open) {
            const payload = getCommentsPayload();
            makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        }
    }, [pluginState.openCommentModalReducer.open]);

    useEffect(() => {
        const {isLoading, isSuccess, error, data, isError} = getCommentsState();
        if (isSuccess) {
            setShowErrorPanel(false);
            setCommentsData(data);
        }

        if (isError && error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
                setShowErrorPanel(true);
            }

            setApiError(error.message);
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
            setApiError(error.message);
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
            show={pluginState.openCommentModalReducer.open}
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
                {showErrorPanel ? (
                    <ResultPanel
                        header={
                            <>
                                {apiError}
                                <a
                                    target='_blank'
                                    rel='noreferrer'
                                    href={Utils.getBaseUrls().pluginApiBaseUrl + CONNECT_ACCOUNT_LINK}
                                >
                                    <Button
                                        text='Connect your account'
                                        extraClass='margin-top-25'
                                        onClick={hideModal}
                                    />
                                </a>
                            </>
                        }
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
                        <ModalSubtitleAndError error={apiError}/>
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
