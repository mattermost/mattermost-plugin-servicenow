import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalLoader, ModalSubtitleAndError, TextArea} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {hideModal as hideCommentModal} from 'reducers/commentModal';

import './styles.scss';

const AddOrViewComments = () => {
    const [commentsData, setCommentsData] = useState<string>('');
    const [comments, setComments] = useState('');
    const [showModalLoader, setShowModalLoader] = useState(false);
    const [apiError, setApiError] = useState('');
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

    const getCommentsState = () => {
        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
        };
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, data: data as string, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    const addCommentState = () => {
        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
            comments,
        };
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    const addComment = () => {
        if (!comments) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
            comments,
        };

        makeApiRequest(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
    };

    const onChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValidationError('');
        setComments(e.target.value);
    };

    useEffect(() => {
        if (pluginState.openCommentModalReducer.recordType && pluginState.openCommentModalReducer.recordId) {
            const payload: CommentsPayload = {
                record_type: pluginState.openCommentModalReducer.recordType,
                record_id: pluginState.openCommentModalReducer.recordId,
            };

            makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        }
    }, [pluginState.openCommentModalReducer.recordType, pluginState.openCommentModalReducer.recordId]);

    useEffect(() => {
        const {isLoading, isSuccess, error, data} = getCommentsState();
        if (isSuccess) {
            setCommentsData(data);
        }

        if (error) {
            setApiError(error);
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
            setApiError(error);
        }

        setShowModalLoader(isLoading);
    }, [addCommentState().isLoading, addCommentState().isError, addCommentState().isSuccess]);

    // Fetch comments from the API when refetch is set
    useEffect(() => {
        if (refetch) {
            const payload: CommentsPayload = {
                record_type: pluginState.openCommentModalReducer.recordType,
                record_id: pluginState.openCommentModalReducer.recordId,
            };

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
                        <>
                            {!showModalLoader && <p className='comment-body__footer'>{Constants.CommentsNotFound}</p>}
                        </>
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
        </Modal>
    );
};

export default AddOrViewComments;
