import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/common';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {EmptyState, CircularLoader, ServiceNowIcon, UnlinkIcon, ConfirmationDialog} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'hooks/usePluginApi';

import Constants, {SubscriptionEventsMap, CONNECT_ACCOUNT_LINK, DOWNLOAD_UPDATE_SET_LINK} from 'plugin_constants';

import {refetch, resetRefetch} from 'reducers/refetchState';

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
    const refetchSubscriptions = pluginState.refetchReducer.refetch;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const {currentUserId} = useSelector((state: GlobalState) => state.entities.users);
    const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<null | string>(null);
    const [deleteApiResponseInvalid, setDeleteApiResponseInvalid] = useState(true);
    const [paginationQueryParams, setPaginationQueryParams] = useState<PaginationQueryParams>({
        page: Constants.DefaultPage,
        per_page: Constants.DefaultPageSize,
    });
    const [totalSubscriptions, setTotalSubscriptions] = useState<SubscriptionData[]>([]);
    const [render, setRender] = useState(true);
    const [filter, setFilter] = useState<SubscriptionFilters>(Constants.DefaultSubscriptionFilters);
    const [resetFilter, setResetFilter] = useState(false);

    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getDeleteSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as string);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    // Reset the pagination params and empty the subscription list
    const resetStates = useCallback(() => {
        setPaginationQueryParams({page: Constants.DefaultPage, per_page: Constants.DefaultPageSize});
        setTotalSubscriptions([]);
    }, []);

    // Increase the page number by 1
    const handlePagination = () => {
        setPaginationQueryParams({...paginationQueryParams, page: paginationQueryParams.page + 1,
        });
    };

    const handleSetFilter = (newFilter: SubscriptionFilters) => {
        setFilter(newFilter);
        resetStates();
    };

    // Fetch the subscriptions from the API
    useEffect(() => {
        const subscriptionParams: FetchSubscriptionsParams = {page: paginationQueryParams.page, per_page: paginationQueryParams.per_page};
        if (!showAllSubscriptions) {
            subscriptionParams.channel_id = currentChannelId;
        }

        if (filter.createdBy === Constants.SubscriptionFilters.ME) {
            subscriptionParams.user_id = currentUserId;
        }

        setRender(false);
        setFetchSubscriptionParams(subscriptionParams);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
    }, [paginationQueryParams]);

    // Reset states on changing channel or using toggle switch
    useEffect(() => {
        // This is used to prevent calling of fetch subscription API twice
        if (render || resetFilter) {
            setResetFilter(false);
            return;
        }

        resetStates();
    }, [currentChannelId, showAllSubscriptions]);

    // Fetch subscriptions from the API when refetch is set
    useEffect(() => {
        if (!refetchSubscriptions) {
            return;
        }

        resetStates();
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
        const {isError, error, isSuccess} = getSubscriptionsState();

        if (isError) {
            if (error?.id === Constants.ApiErrorIdNotConnected || error?.id === Constants.ApiErrorIdRefreshTokenExpired) {
                if (connected) {
                    dispatch(setConnected(false));
                }
                return;
            } else if (error?.id === Constants.ApiErrorIdSubscriptionsNotConfigured) {
                setSubscriptionsEnabled(false);
                if (!connected) {
                    dispatch(setConnected(true));
                }
                return;
            } else if (error?.id === Constants.ApiErrorIdSubscriptionsUnauthorized && subscriptionsAuthorized) {
                setSubscriptionsAuthorized(false);
            }

            if (!subscriptionsAuthorized && error?.id !== Constants.ApiErrorIdSubscriptionsUnauthorized) {
                setSubscriptionsAuthorized(true);
            }

            if (!subscriptionsEnabled) {
                setSubscriptionsEnabled(true);
            }
            if (!connected) {
                dispatch(setConnected(true));
            }
        }

        if (isSuccess) {
            setTotalSubscriptions([...totalSubscriptions, ...subscriptions]);
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
    }, [getSubscriptionsState().isError, getSubscriptionsState().isSuccess, getSubscriptionsState().isLoading]);

    const {isLoading: subscriptionsLoading, data: subscriptions} = getSubscriptionsState();
    const {isLoading: deletingSubscription, isError: errorInDeletingSubscription, error: deleteSubscriptionError} = getDeleteSubscriptionState();
    return (
        <div className='rhs-content position-relative padding-top-15 padding-bottom-12 padding-h-12'>
            {subscriptionsLoading && !paginationQueryParams.page && <CircularLoader/>}
            {connected && subscriptionsEnabled && subscriptionsAuthorized && (
                <>
                    <RhsData
                        showAllSubscriptions={showAllSubscriptions}
                        setShowAllSubscriptions={setShowAllSubscriptions}
                        totalSubscriptions={totalSubscriptions}
                        loadingSubscriptions={subscriptionsLoading}
                        handleEditSubscription={handleEditSubscription}
                        handleDeleteClick={handleDeleteClick}
                        error={getSubscriptionsState().error?.message}
                        isCurrentUserSysAdmin={isCurrentUserSysAdmin}
                        paginationQueryParams={paginationQueryParams}
                        handlePagination={handlePagination}
                        filter={filter}
                        setFilter={handleSetFilter}
                        setResetFilter={setResetFilter}
                    />
                    {toBeDeleted && (
                        <ConfirmationDialog
                            title={Constants.DeleteSubscriptionHeading}
                            confirmationMsg={Constants.DeleteSubscriptionMsg}
                            show={isDeleteConfirmationOpen}
                            onHide={hideDeleteConfirmation}
                            loading={!deleteApiResponseInvalid && deletingSubscription}
                            onConfirm={handleDeleteConfirmation}
                            error={deleteApiResponseInvalid || deletingSubscription || !errorInDeletingSubscription ? '' : deleteSubscriptionError?.message}
                        />
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
