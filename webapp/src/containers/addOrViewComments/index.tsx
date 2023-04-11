import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CircularLoader, CustomModal as Modal, ModalFooter, ModalHeader, ModalLoader, ResultPanel, TextArea} from '@brightscout/mattermost-ui-library';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
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
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [showErrorPanel, setShowErrorPanel] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [refetch, setRefetch] = useState(false);

    // usePluginApi hook
    const {pluginState, makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();

    const dispatch = useDispatch();

    const resetFieldStates = useCallback(() => {
        setCommentsData('');
        setComments('');
        setApiError(null);
        setValidationError('');
        setRefetch(false);
        setShowErrorPanel(false);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        setTimeout(() => {
            resetFieldStates();
        });
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
        const {isLoading, data} = getApiState(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        return {isLoading, data: data as string};
    };

    const addCommentState = () => {
        const payload = getCommentsPayload();
        const {isLoading} = getApiState(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
        return {isLoading};
    };

    const addComment = () => {
        if (!comments) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        const payload = getCommentsPayload();
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.addComments.apiServiceName, payload);
    };

    const onChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValidationError('');
        setComments(e.target.value);
    };

    const handleError = (error: APIError) => {
        if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
            dispatch(setConnected(false));
        }

        setShowErrorPanel(true);
        setApiError(error);
    };

    useEffect(() => {
        if (isCommentModalOpen(pluginState)) {
            const payload = getCommentsPayload();
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
        }
    }, [isCommentModalOpen(pluginState)]);

    // Fetch comments from the API when refetch is set
    useEffect(() => {
        if (refetch) {
            const payload = getCommentsPayload();
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getComments.apiServiceName, payload);
            setRefetch(false);
        }
    }, [refetch]);

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getComments.apiServiceName,
        payload: getCommentsPayload(),
        handleSuccess: () => {
            setShowErrorPanel(false);
            setCommentsData(data);
        },
        handleError,
    });

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.addComments.apiServiceName,
        payload: getCommentsPayload(),
        handleSuccess: () => {
            setComments('');
            setRefetch(true);
        },
        handleError,
    });

    const {isLoading: getCommentsLoading, data} = getCommentsState();
    const {isLoading: addCommentLoading} = addCommentState();
    const showLoader = getCommentsLoading || addCommentLoading;
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
                <ModalLoader loading={addCommentLoading}/>
                {showLoader && !comments && <CircularLoader/>}
                {showErrorPanel && apiError && !showLoader ? (
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
                    <div className='servicenow-comment-modal'>
                        <div
                            className={`comment-body
                                    ${((!commentsData.length || apiError) && !showLoader) && 'comment-body__height'}`}
                        >
                            <TextArea
                                placeholder='Write new comment here'
                                value={comments}
                                onChange={onChangeHandle}
                                className='comment-body__text-area'
                                disabled={showLoader}
                                error={validationError}
                            />
                            <h4 className='comment-body__heading'>{Constants.CommentsHeading}</h4>
                            {commentsData ? (
                                <>
                                    <div className='comment-body__description-text'>{commentsData}</div>
                                    <p className='comment-body__footer'>{Constants.NoCommentsPresent}</p>
                                </>
                            ) : (
                                !showLoader && <p className='comment-body__footer'>{Constants.CommentsNotFound}</p>
                            )}
                        </div>
                        <ModalFooter
                            onConfirm={addComment}
                            confirmBtnText='Submit'
                            confirmDisabled={showLoader}
                            onHide={hideModal}
                            cancelBtnText='Cancel'
                            cancelDisabled={showLoader}
                        />
                    </div>
                )}
            </>
        </Modal>
    );
};

export default AddOrViewComments;
