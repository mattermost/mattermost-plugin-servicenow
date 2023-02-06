import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-webapp/types/store';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/common';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {EmptyState, CircularLoader, ServiceNowIcon, UnlinkIcon, ConfirmationDialog} from '@brightscout/mattermost-ui-library';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';

import Constants, {CONNECT_ACCOUNT_LINK, UPLOAD_SET_FILENAME, ModalIds} from 'src/plugin_constants';

import {refetch, resetRefetch} from 'src/reducers/refetchState';

import {setConnected} from 'src/reducers/connectedState';
import {setGlobalModalState} from 'src/reducers/globalModal';

import Utils from 'src/utils';

import RhsData from './rhsData';
import Header from './rhsHeader';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const {pluginState, makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();
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
    const [paginationQueryParams, setPaginationQueryParams] = useState<PaginationQueryParams>({
        page: Constants.DefaultPage,
        per_page: Constants.DefaultPageSize,
    });
    const [totalSubscriptions, setTotalSubscriptions] = useState<SubscriptionData[]>([]);
    const [render, setRender] = useState(true);
    const [filter, setFilter] = useState<SubscriptionFilters>(Constants.DefaultSubscriptionFilters);
    const [resetFilter, setResetFilter] = useState(false);

    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams);
        return {isLoading, isSuccess, data: data as SubscriptionData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const getDeleteSubscriptionState = () => {
        const {isLoading, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted);
        return {isLoading, isError, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
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
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
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

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName,
        payload: toBeDeleted,
        handleSuccess: () => {
            setDeleteConfirmationOpen(false);
            dispatch(refetch());
            setToBeDeleted(null);
        },
    });

    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = useCallback((subscription: SubscriptionData) => {
        const subscriptionData: EditSubscriptionData = {
            channel: subscription.channel_id,
            recordId: subscription.record_id,
            type: subscription.type,
            recordType: subscription.record_type,
            subscriptionEvents: Utils.getSubscriptionEvents(subscription.subscription_events),
            id: subscription.sys_id,
            userId: subscription.user_id,
            filters: subscription.filters,
        };
        dispatch(setGlobalModalState({modalId: ModalIds.EDIT_SUBSCRIPTION, data: subscriptionData}));
    }, [dispatch]);

    // Handles action when the delete button is clicked
    const handleDeleteClick = (subscription: SubscriptionData) => {
        setToBeDeleted(subscription.sys_id);
        setDeleteConfirmationOpen(true);
    };

    // Handles action when the delete confirmation button is clicked
    const handleDeleteConfirmation = () => {
        makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as string);
    };

    // Handles action when the delete confirmation modal is closed
    const hideDeleteConfirmation = () => {
        setDeleteConfirmationOpen(false);
        setToBeDeleted(null);
    };

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName,
        payload: fetchSubscriptionParams,
        handleSuccess: () => {
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
        },
        handleError: (error) => {
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
        },
    });

    const {isLoading: subscriptionsLoading, isSuccess, data: subscriptions, error: getSubscriptionsError} = getSubscriptionsState();
    const {isLoading: deletingSubscription, isError: errorInDeletingSubscription, error: deleteSubscriptionError} = getDeleteSubscriptionState();
    return (
        <div className='servicenow-rhs'>
            <div className='rhs-content position-relative padding-top-15 padding-bottom-12 padding-h-12'>
                {subscriptionsLoading && !paginationQueryParams.page && <CircularLoader/>}
                {connected && (
                    <Header
                        showFilterIcon={subscriptionsEnabled && subscriptionsAuthorized}
                        showAllSubscriptions={showAllSubscriptions}
                        setShowAllSubscriptions={setShowAllSubscriptions}
                        filter={filter}
                        setFilter={handleSetFilter}
                        setResetFilter={setResetFilter}
                    />
                )}
                {connected && subscriptionsEnabled && subscriptionsAuthorized && (
                    <>
                        <RhsData
                            showAllSubscriptions={showAllSubscriptions}
                            totalSubscriptions={totalSubscriptions}
                            loadingSubscriptions={subscriptionsLoading}
                            handleEditSubscription={handleEditSubscription}
                            handleDeleteClick={handleDeleteClick}
                            error={getSubscriptionsError?.message}
                            isCurrentUserSysAdmin={isCurrentUserSysAdmin}
                            paginationQueryParams={paginationQueryParams}
                            handlePagination={handlePagination}
                        />
                        {toBeDeleted && (
                            <ConfirmationDialog
                                title={Constants.DeleteSubscriptionHeading}
                                confirmationMsg={Constants.DeleteSubscriptionMsg}
                                show={isDeleteConfirmationOpen}
                                onHide={hideDeleteConfirmation}
                                loading={deletingSubscription}
                                onConfirm={handleDeleteConfirmation}
                                error={deletingSubscription || !errorInDeletingSubscription ? '' : deleteSubscriptionError?.message}
                            />
                        )}
                    </>
                )}
                {connected && !isSuccess && !subscriptionsLoading && (
                    <>
                        {!subscriptionsEnabled && (
                            <EmptyState
                                title={Constants.SubscriptionsConfigErrorTitle}
                                subTitle={isCurrentUserSysAdmin ? Constants.SubscriptionsConfigErrorSubtitleForAdmin : Constants.SubscriptionsConfigErrorSubtitleForUser}
                                buttonConfig={isCurrentUserSysAdmin ? ({
                                    text: 'Download update set',
                                    link: Utils.getBaseUrls().publicFilesUrl + UPLOAD_SET_FILENAME,
                                    download: true,
                                }) : null
                                }
                                className='configuration-not-enabled-err-state'
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
        </div>
    );
};

export default Rhs;
