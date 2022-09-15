import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/common';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import EmptyState from 'components/emptyState';
import CircularLoader from 'components/loader/circular';
import Modal from 'components/modal';
import {ServiceNowIcon, UnlinkIcon} from 'containers/icons';

import usePluginApi from 'hooks/usePluginApi';

import Constants, {SubscriptionEventsMap, CONNECT_ACCOUNT_LINK, DOWNLOAD_UPDATE_SET_LINK} from 'plugin_constants';

import {refetch, resetRefetch} from 'reducers/refetchSubscriptions';

import {showModal as showEditModal} from 'reducers/editSubscriptionModal';
import {setConnected} from 'reducers/connectedState';

import Utils from 'utils';

import RhsData from './rhsData';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();
    const isCurrentUserSysAdmin = useSelector((state: GlobalState) => getCurrentUser(state).roles.includes(MMConstants.SYSTEM_ADMIN_ROLE));
    const dispatch = useDispatch();
    const connected = pluginState.connectedReducer.connected;
    const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
    const [subscriptionsAuthorized, setSubscriptionsAuthorized] = useState(false);
    const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
    const [fetchSubscriptionParams, setFetchSubscriptionParams] = useState<FetchSubscriptionsParams | null>(null);
    const refetchSubscriptions = pluginState.refetchSubscriptionsReducer.refetchSubscriptions;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<null | string>(null);
    const [deleteApiResponseInvalid, setDeleteApiResponseInvalid] = useState(true);

    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getDeleteSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as string);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    // Fetch all the subscriptions from the API
    useEffect(() => {
        if (!showAllSubscriptions) {
            return;
        }
        const subscriptionParams: FetchSubscriptionsParams = {page: Constants.DefaultPage, per_page: Constants.DefaultPageSize};
        setFetchSubscriptionParams(subscriptionParams);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
    }, [showAllSubscriptions]);

    // Fetch subscriptions from the API if the active channel changes or showAllSubscription is reset
    useEffect(() => {
        if (showAllSubscriptions) {
            return;
        }
        const subscriptionParams: FetchSubscriptionsParams = {page: Constants.DefaultPage, per_page: Constants.DefaultPageSize, channel_id: currentChannelId};
        setFetchSubscriptionParams(subscriptionParams);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
    }, [currentChannelId, showAllSubscriptions]);

    // Fetch subscriptions from the API when refetch is set
    useEffect(() => {
        if (!refetchSubscriptions) {
            return;
        }

        const subscriptionParams: FetchSubscriptionsParams = {page: Constants.DefaultPage, per_page: Constants.DefaultPageSize};

        if (!showAllSubscriptions) {
            subscriptionParams.channel_id = currentChannelId;
        }
        setFetchSubscriptionParams(subscriptionParams);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
        dispatch(resetRefetch());
    }, [refetchSubscriptions]);

    useEffect(() => {
        if (getDeleteSubscriptionState().isSuccess && !deleteApiResponseInvalid) {
            setDeleteConfirmationOpen(false);
            dispatch(refetch());
            setDeleteApiResponseInvalid(true);
            setToBeDeleted(null);
        }

        // When a new API request is made, reset the flag set for invalid delete api response
        if (getDeleteSubscriptionState().isLoading) {
            setDeleteApiResponseInvalid(false);
        }
    }, [getDeleteSubscriptionState().isSuccess, getDeleteSubscriptionState().isLoading, deleteApiResponseInvalid]);

    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = useCallback((subscription: SubscriptionData) => {
        const events = subscription.subscription_events.split(',');
        const subscriptionEvents = events.map((event) => SubscriptionEventsMap[event]);
        const subscriptionData: EditSubscriptionData = {
            channel: subscription.channel_id,
            recordId: subscription.record_id,
            type: subscription.type,
            recordType: subscription.record_type,
            subscriptionEvents,
            id: subscription.sys_id,
        };
        dispatch(showEditModal(subscriptionData));
    }, [dispatch]);

    // Handles action when the delete button is clicked
    const handleDeleteClick = (subscription: SubscriptionData) => {
        setToBeDeleted(subscription.sys_id);
        setDeleteConfirmationOpen(true);
    };

    // Handles action when the delete confirmation button is clicked
    const handleDeleteConfirmation = () => {
        makeApiRequest(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as string);
    };

    // Handles action when the delete confirmation modal is closed
    const hideDeleteConfirmation = () => {
        setDeleteConfirmationOpen(false);
        setDeleteApiResponseInvalid(true);
        setToBeDeleted(null);
    };

    useEffect(() => {
        const subscriptionsState = getSubscriptionsState();

        if (subscriptionsState.isError) {
            if (subscriptionsState.error?.id === Constants.ApiErrorIdNotConnected) {
                if (connected) {
                    dispatch(setConnected(false));
                }
                return;
            } else if (subscriptionsState.error?.id === Constants.ApiErrorIdSubscriptionsNotConfigured) {
                setSubscriptionsEnabled(false);
                if (!connected) {
                    dispatch(setConnected(true));
                }
                return;
            } else if (subscriptionsState.error?.id === Constants.ApiErrorIdSubscriptionsUnauthorized && subscriptionsAuthorized) {
                setSubscriptionsAuthorized(false);
            }

            if (!subscriptionsAuthorized && subscriptionsState.error?.id !== Constants.ApiErrorIdSubscriptionsUnauthorized) {
                setSubscriptionsAuthorized(true);
            }

            if (!subscriptionsEnabled) {
                setSubscriptionsEnabled(true);
            }
            if (!connected) {
                dispatch(setConnected(true));
            }
        }

        if (subscriptionsState.isSuccess) {
            if (!connected) {
                dispatch(setConnected(true));
            }

            if (!subscriptionsEnabled) {
                setSubscriptionsEnabled(true);
            }

            if (!subscriptionsAuthorized) {
                setSubscriptionsAuthorized(true);
            }
        }
    }, [getSubscriptionsState().isError, getSubscriptionsState().isSuccess]);

    const {isLoading: subscriptionsLoading, data: subscriptions} = getSubscriptionsState();
    const {isLoading: deletingSubscription, isError: errorInDeletingSubscription, error: deleteSubscriptionError} = getDeleteSubscriptionState();
    return (
        <div className='rhs-content'>
            {subscriptionsLoading && <CircularLoader/>}
            {connected && subscriptionsEnabled && subscriptionsAuthorized && (
                <>
                    <RhsData
                        showAllSubscriptions={showAllSubscriptions}
                        setShowAllSubscriptions={setShowAllSubscriptions}
                        subscriptions={subscriptions}
                        loadingSubscriptions={subscriptionsLoading}
                        handleEditSubscription={handleEditSubscription}
                        handleDeleteClick={handleDeleteClick}
                        error={getSubscriptionsState().error?.message}
                    />
                    {toBeDeleted && (
                        <Modal
                            show={isDeleteConfirmationOpen}
                            onHide={hideDeleteConfirmation}
                            title='Confirm Delete Subscription'
                            confirmBtnText='Delete'
                            className='delete-confirmation-modal'
                            onConfirm={handleDeleteConfirmation}
                            cancelDisabled={!deleteApiResponseInvalid && deletingSubscription}
                            confirmDisabled={!deleteApiResponseInvalid && deletingSubscription}
                            loading={!deleteApiResponseInvalid && deletingSubscription}
                            error={deleteApiResponseInvalid || deletingSubscription || !errorInDeletingSubscription ? '' : deleteSubscriptionError?.message}
                            confirmBtnClassName='btn-danger'
                        >
                            <p className='delete-confirmation-modal__text'>{'Are you sure you want to delete the subscription?'}</p>
                        </Modal>
                    )}
                </>
            )}
            {connected && !subscriptionsLoading && (
                <>
                    {!subscriptionsEnabled && (
                        <EmptyState
                            title={Constants.SubscriptionsConfigErrorTitle}
                            subTitle={isCurrentUserSysAdmin ? Constants.SubscriptionsConfigErrorSubtitleForAdmin : Constants.SubscriptionsConfigErrorSubtitleForUser}
                            buttonConfig={isCurrentUserSysAdmin ? ({
                                text: 'Download update set',
                                link: Utils.getBaseUrls().pluginApiBaseUrl + DOWNLOAD_UPDATE_SET_LINK,
                                download: true,
                            }) : null
                            }
                            className='configuration-err-state'
                            icon={<UnlinkIcon/>}
                        />
                    )}
                    {!subscriptionsAuthorized && (
                        <EmptyState
                            title={Constants.SubscriptionsUnauthorizedErrorTitle}
                            subTitle={isCurrentUserSysAdmin ? Constants.SubscriptionsUnauthorizedErrorSubtitleForAdmin : Constants.SubscriptionsUnauthorizedErrorSubtitleForUser}
                            className='configuration-err-state'
                            icon={<UnlinkIcon/>}
                        />
                    )}
                </>
            )}
            {!connected && !subscriptionsLoading && (
                <EmptyState
                    title='No Account Connected'
                    buttonConfig={{
                        text: 'Connect your account',
                        link: Utils.getBaseUrls().pluginApiBaseUrl + CONNECT_ACCOUNT_LINK,
                    }}
                    className='configuration-err-state'
                    icon={<ServiceNowIcon className='account-not-connected-icon rhs-state-icon'/>}
                />
            )}
        </div>
    );
};

export default Rhs;
