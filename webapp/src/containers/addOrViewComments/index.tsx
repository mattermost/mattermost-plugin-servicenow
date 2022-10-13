/* eslint-disable no-lone-blocks */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalSubtitleAndError} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {hideModal as hideCommentModal} from 'reducers/commentModal';

import Spinner from 'components/spinner';

import TextField from './input';

import './styles.scss';

const AddOrViewComments = () => {
    const [commentsData, setCommentsData] = useState<string[]>([]);
    const [comments, setComments] = useState('');
    const [getcommentsPayload, setGetCommentsPayload] = useState<CommentsPayload | null>(null);
    const [addcommentsPayload, setAddCommentsPayload] = useState<CommentsPayload | null>(null);
    const [showModalLoader, setShowModalLoader] = useState(false);
    const [apiError, setApiError] = useState('');
    const [error, setError] = useState('');
    const [paginationQueryParams, setPaginationQueryParams] = useState<PaginationQueryParams>({
        page: Constants.DefaultPage,
        per_page: Constants.DefaultPageSize,
    });

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setCommentsData([]);
        setComments('');
        setGetCommentsPayload(null);
        setAddCommentsPayload(null);
        setShowModalLoader(false);
        setApiError('');
        setError('');
        setPaginationQueryParams({
            page: Constants.DefaultPage,
            per_page: Constants.DefaultPageSize,
        });
    }, []);

    const hideModal = useCallback(() => {
        resetFieldStates();
        dispatch(hideCommentModal());
    }, []);

    const getCommentsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, getcommentsPayload as CommentsPayload);
        return {isLoading, isSuccess, isError, data: data as string[], error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message || ''};
    };

    const getAddCommentState = () => {
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

    // Increase the page number by 1
    const handlePagination = () => {
        setPaginationQueryParams({...paginationQueryParams, page: paginationQueryParams.page + 1,
        });
    };

    const hasMoreComments = useMemo<boolean>(() => (
        commentsData.length !== 0 && (commentsData.length - (paginationQueryParams.page * Constants.DefaultPageSize) === Constants.DefaultPageSize)
    ), [commentsData]);

    useEffect(() => {
        if (!pluginState.openCommentModalReducer.recordType || !pluginState.openCommentModalReducer.recordId) {
            return;
        }

        const payload: CommentsPayload = {
            record_type: pluginState.openCommentModalReducer.recordType,
            record_id: pluginState.openCommentModalReducer.recordId,
            params: {
                page: paginationQueryParams.page,
                per_page: paginationQueryParams.per_page,
            },
        };
        setGetCommentsPayload(payload);
        makeApiRequest(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
    }, [pluginState.openCommentModalReducer.recordType, pluginState.openCommentModalReducer.recordId, paginationQueryParams]);

    useEffect(() => {
        const commentState = getCommentsState();
        if (commentState.isSuccess) {
            setCommentsData([...commentsData, ...commentState.data]);
        }

        if (commentState.error) {
            setApiError(commentState.error);
        }

        setShowModalLoader(commentState.isLoading);
    }, [getCommentsState().isLoading, getCommentsState().isError, getCommentsState().isSuccess]);

    useEffect(() => {
        const addCommentState = getAddCommentState();
        if (addCommentState.isSuccess) {
            hideModal();
        }

        if (addCommentState.error) {
            setApiError(addCommentState.error);
        }

        setShowModalLoader(addCommentState.isLoading);
    }, [getAddCommentState().isLoading, getAddCommentState().isError, getAddCommentState().isSuccess]);

    // console.log('has more', hasMoreComments, paginationQueryParams);

    return (
        <Modal
            show={pluginState.openCommentModalReducer.open}
            onHide={hideModal}
        >
            <>
                <ModalHeader
                    title={'Comment'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <TextField
                    placeholder='Write new comment here'
                    value={comments}
                    onChange={onChangeHandle}
                    className='comment-text-field'
                    error={error}
                />
                <div
                    id='scrollableArea'
                    className='comment-body comment-body__scroller'
                >
                    <h4 className='comment-body__heading'>{Constants.CommentsHeading}</h4>
                    {showModalLoader && !paginationQueryParams.page && !comments && <CircularLoader/>}
                    {commentsData.length > 0 && (
                        <InfiniteScroll
                            dataLength={commentsData.length}
                            next={handlePagination}
                            hasMore={hasMoreComments}
                            loader={
                                <Spinner
                                    extraClass='comment-body__spinner'
                                />}
                            endMessage={
                                <p style={{textAlign: 'center'}}>
                                    <b>{Constants.NoCommentsPresent}</b>
                                </p>
                            }
                            scrollableTarget='scrollableArea'
                        >
                            {commentsData.map((data) => (
                                <div
                                    key={data}
                                    className='comment-body__description-text'
                                >{data}</div>
                            ))}

                        </InfiniteScroll>
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

{/* <ul className='comment-body__description'>
                                {
                                    // commentsData.map((data) => (
                                        <li
                                            key={data}
                                            className='comment-body__description-text'
                                        >
                                            <span>{data}</span>
                                        </li>
                                    ))
                                }
                            </ul> */}
