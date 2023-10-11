import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

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
    const [refetch, setRefetch] = useState(false);
    const siteUrl = useSelector(Utils.getSiteUrl);

    // usePluginApi hook
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setCommentsData('');
        setComments('');
        setShowModalLoader(false);
        setApiError(null);
        setRefetch(false);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        resetFieldStates();
    }, []);

    const getCommentsPayload = (): CommentsPayload => {
        const data = getGlobalModalState(pluginState).data as CommentAndStateModalData;
        return {
            record_type: data?.recordType || '',
            record_id: data?.recordId || '',
            comments,
        };
    };

    const getCommentsState = () => {
        const payload = getCommentsPayload();
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, data: data as string, error: apiErr};
    };

    const addCommentState = () => {
        const payload = getCommentsPayload();
        const {isLoading, isSuccess, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
        return {isLoading, isSuccess, isError, error: apiErr};
    };

    const addComment = () => {
        const payload = getCommentsPayload();
        makeApiRequest(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
    };

    const onChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                        header={Utils.getResultPanelHeader(apiError, hideModal, siteUrl)}
                        className='wizard__secondary-panel--slide-in result-panel'
                        primaryBtn={{
                            text: 'Close',
                            onClick: hideModal,
                        }}
                        iconClass='fa-times-circle-o result-panel-icon--error'
                    />
                ) : (
                    <div className='servicenow-comment-modal'>
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
                            confirmDisabled={showModalLoader || !comments.length}
                            onHide={hideModal}
                            cancelBtnText='Cancel'
                            cancelDisabled={showModalLoader}
                        />
                    </div>
                )}
            </>
        </Modal>
    );
};

export default AddOrViewComments;
