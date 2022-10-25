import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalSubtitleAndError, TextField} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {hideModal as hideCommentModal} from 'reducers/commentModal';
import {refetch, resetRefetch} from 'reducers/refetchState';

import './styles.scss';

const AddOrViewComments = () => {
    const [commentsData, setCommentsData] = useState<string>('');
    const [comments, setComments] = useState('');
    const [getcommentsPayload, setGetCommentsPayload] = useState<CommentsPayload | null>(null);
    const [addcommentsPayload, setAddCommentsPayload] = useState<CommentsPayload | null>(null);
    const [showModalLoader, setShowModalLoader] = useState(false);
    const [apiError, setApiError] = useState('');
    const [error, setError] = useState('');

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    const refetchComments = pluginState.refetchReducer.refetch;

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setCommentsData('');
        setComments('');
        setGetCommentsPayload(null);
        setAddCommentsPayload(null);
        setShowModalLoader(false);
        setApiError('');
        setError('');
    }, []);

    const hideModal = useCallback(() => {
        dispatch(hideCommentModal());
        resetFieldStates();
    }, []);

    const getCommentsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, getcommentsPayload as CommentsPayload);
        return {isLoading, isSuccess, isError, data: data as string, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    const addCommentState = () => {
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.addComments.apiServiceName, addcommentsPayload as CommentsPayload);
        return {isLoading, isSuccess, isError, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    const addComment = () => {
        if (!comments) {
            setError(Constants.RequiredMsg);
            return;
        }

        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
            comments,
        };

        setAddCommentsPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
    };

    const onChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setError('');
        setComments(e.target.value);
    };

    useEffect(() => {
        if (!pluginState.openCommentModalReducer.recordType || !pluginState.openCommentModalReducer.recordId) {
            return;
        }

        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
        };

        setGetCommentsPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
    }, [pluginState.openCommentModalReducer.recordType, pluginState.openCommentModalReducer.recordId]);

    useEffect(() => {
        const commentState = getCommentsState();
        if (commentState.isSuccess) {
            setCommentsData(commentState.data);
        }

        if (commentState.error) {
            setApiError(commentState.error);
        }

        setShowModalLoader(commentState.isLoading);
    }, [getCommentsState().isLoading, getCommentsState().isError, getCommentsState().isSuccess]);

    useEffect(() => {
        const commentState = addCommentState();
        if (commentState.isSuccess) {
            setComments('');
            dispatch(refetch());
        }

        if (commentState.error) {
            setApiError(commentState.error);
        }

        setShowModalLoader(commentState.isLoading);
    }, [addCommentState().isLoading, addCommentState().isError, addCommentState().isSuccess]);

    // Fetch comments from the API when refetch is set
    useEffect(() => {
        if (!refetchComments) {
            return;
        }

        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
        };

        setGetCommentsPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        dispatch(resetRefetch());
    }, [refetchComments]);

    return (
        <Modal
            show={pluginState.openCommentModalReducer.open}
            onHide={hideModal}
        >
            <>
                <ModalHeader
                    title={'Add comments'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {showModalLoader && !comments && <CircularLoader/>}
                <div
                    className={`comment-body
                                ${((!commentsData.length || apiError) && !showModalLoader) && 'comment-body__height'}`}
                >
                    <TextField
                        placeholder='Write new comment here'
                        value={comments}
                        onChange={onChangeHandle}
                        className='comment-body__text-field'
                        disabled={showModalLoader}
                        error={error}
                    />
                    {!apiError && <h4 className='comment-body__heading'>{Constants.CommentsHeading}</h4>}
                    {commentsData ? (
                        <>
                            <div className='comment-body__description-text'>{commentsData}</div>
                            {!showModalLoader && <p className='comment-body__footer'>{Constants.NoCommentsPresent}</p>}
                        </>
                    ) : (
                        <>
                            {!showModalLoader && <p className='comment-body__footer'>{Constants.CommentsNotFound}</p>}
                        </>
                    )}
                </div>
                <ModalSubtitleAndError error={apiError}/>
                <ModalFooter
                    onConfirm={addComment}
                    confirmBtnText={'Submit'}
                    confirmDisabled={showModalLoader}
                    onHide={hideModal}
                    cancelBtnText={'Cancel'}
                    cancelDisabled={showModalLoader}
                />
            </>
        </Modal>
    );
};

export default AddOrViewComments;
