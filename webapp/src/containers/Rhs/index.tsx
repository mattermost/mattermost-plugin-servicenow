import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/common';
import {General as MMConstants} from 'mattermost-redux/constants';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import ToggleSwitch from 'components/toggleSwitch';

import EmptyState from 'components/emptyState';
import SubscriptionCard from 'components/card/subscription';
import CircularLoader from 'components/loader/circular';
import Modal from 'components/modal';

import usePluginApi from 'hooks/usePluginApi';

import Constants, {SubscriptionEvents} from 'plugin_constants';

import {refetch, resetRefetch} from 'reducers/refetchSubscriptions';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditModal} from 'reducers/editSubscriptionModal';
import {setConnected} from 'reducers/connectedState';

import Utils from 'utils';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const {pluginState, makeApiRequest, getApiState} = usePluginApi();
    const isCurrentUserSysAdmin = useSelector((state: GlobalState) => getCurrentUser(state).roles.includes(MMConstants.SYSTEM_ADMIN_ROLE));
    const dispatch = useDispatch();
    const connected = pluginState.connectedReducer.connected;
    const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
    const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
    const [fetchSubscriptionParams, setFetchSubscriptionParams] = useState<FetchSubscriptionsParams | null>(null);
    const refetchSubscriptions = pluginState.refetchSubscriptionsReducer.refetchSubscriptions;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<null | string>(null);
    const [invalidDeleteApi, setInvalidDeleteApi] = useState(true);

    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: ((apiErr as FetchBaseQueryError)?.data) as APIError};
    };

    const getDeleteSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as string);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: ((apiErr as FetchBaseQueryError)?.data) as APIError};
    };

    // Fetch subscriptions from the API
    useEffect(() => {
        const subscriptionParams: FetchSubscriptionsParams = {page: Constants.DefaultPage, per_page: Constants.DefaultPageSize};
        if (!showAllSubscriptions) {
            subscriptionParams.channel_id = currentChannelId;
        }
        setFetchSubscriptionParams(subscriptionParams);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, subscriptionParams);
    }, [showAllSubscriptions]);

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
    }, [refetchSubscriptions, showAllSubscriptions]);

    useEffect(() => {
        if (getDeleteSubscriptionState().isSuccess && !invalidDeleteApi) {
            setDeleteConfirmationOpen(false);
            dispatch(refetch());
            setInvalidDeleteApi(true);
            setToBeDeleted(null);
        }

        // When a new API request is made, reset the flag set for invalid delete api response
        if (getDeleteSubscriptionState().isLoading) {
            setInvalidDeleteApi(false);
        }
    }, [getDeleteSubscriptionState().isSuccess, getDeleteSubscriptionState().isLoading, invalidDeleteApi]);

    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = (subscription: SubscriptionData) => {
        const subscriptionData: EditSubscriptionData = {
            channel: subscription.channel_id,
            recordId: subscription.record_id,
            recordType: subscription.record_type as RecordType,
            subscriptionEvents: subscription.subscription_events.split(',') as unknown as SubscriptionEvents[],
            id: subscription.sys_id,
        };
        dispatch(showEditModal(subscriptionData));
    };

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
        setInvalidDeleteApi(true);
        setToBeDeleted(null);
    };

    useEffect(() => {
        const subscriptionsState = getSubscriptionsState();
        if (subscriptionsState.isError && !subscriptionsState.isSuccess) {
            if (subscriptionsState.error?.id === 'not_connected' && connected) {
                dispatch(setConnected(false));
            }

            if (subscriptionsState.error?.id === 'subscriptions_not_configured') {
                setSubscriptionsEnabled(false);
                if (!connected) {
                    dispatch(setConnected(true));
                }
            } else if (!subscriptionsEnabled) {
                setSubscriptionsEnabled(true);
            }
        }

        if (!subscriptionsState.isError && subscriptionsState.isSuccess && subscriptionsState.data) {
            if (!connected) {
                dispatch(setConnected(true));
            }

            if (!subscriptionsEnabled) {
                setSubscriptionsEnabled(true);
            }
        }
    }, [getSubscriptionsState().isError, getSubscriptionsState().isSuccess]);

    // Returns card-body for the subscription cards
    const getSubscriptionCardBody = (subscription: SubscriptionData): SubscriptionCardBody => ({
        labelValuePairs: [
            {
                label: 'ID',
                value: subscription.sys_id,
            },
        ],
        list: subscription.subscription_events.split(',').map((event) => Constants.SubscriptionEventLabels[event]),
    });

    const {isLoading: subscriptionsLoading, data: subscriptions} = getSubscriptionsState();
    return (
        <div className='rhs-content'>
            {connected && subscriptionsEnabled && (
                <>
                    <ToggleSwitch
                        active={showAllSubscriptions}
                        onChange={(newState) => setShowAllSubscriptions(newState)}
                        label={Constants.RhsToggleLabel}
                    />
                    {(subscriptions?.length > 0 && !subscriptionsLoading) && (
                        <>
                            <div className='rhs-content__cards-container'>
                                {subscriptions.map((subscription) => (
                                    <SubscriptionCard
                                        key={subscription.sys_id}
                                        header={`${subscription.number} | ${subscription.short_description}`}
                                        label={subscription.type === 'record' ? 'Record subscription' : 'Bulk subscription'}
                                        onEdit={() => handleEditSubscription(subscription)}
                                        onDelete={() => handleDeleteClick(subscription)}
                                        cardBody={getSubscriptionCardBody(subscription)}
                                    />
                                ))}
                            </div>
                            <div className='rhs-btn-container'>
                                <button
                                    className='btn btn-primary rhs-btn'
                                    onClick={() => dispatch(showAddModal())}
                                >
                                    {'Add Subscription'}
                                </button>
                            </div>
                        </>
                    )}
                    {!subscriptions?.length && !subscriptionsLoading && (
                        <EmptyState
                            title='No Subscriptions Found'
                            buttonConfig={{
                                text: 'Add new Subscription',
                                action: () => dispatch(showAddModal()),
                            }}
                            iconClass='fa fa-bell-slash-o'
                        />
                    )}
                    {toBeDeleted && (
                        <Modal
                            show={deleteConfirmationOpen}
                            onHide={hideDeleteConfirmation}
                            title='Confirm Delete Subscription'
                            cancelBtnText='Cancel'
                            confirmBtnText='Delete'
                            className='delete-confirmation-modal'
                            onConfirm={handleDeleteConfirmation}
                            cancelDisabled={!invalidDeleteApi && getDeleteSubscriptionState().isLoading}
                            confirmDisabled={!invalidDeleteApi && getDeleteSubscriptionState().isLoading}
                            loading={!invalidDeleteApi && getDeleteSubscriptionState().isLoading}
                            error={invalidDeleteApi || getDeleteSubscriptionState().isLoading || !getDeleteSubscriptionState().isError ? '' : getDeleteSubscriptionState().error.message}
                            confirmBtnClassName='btn-danger'
                        >
                            <>
                                <p className='delete-confirmation-modal__text'>{'Are you sure you want to delete the subscription?'}</p>
                            </>
                        </Modal>
                    )}
                </>
            )}
            {subscriptionsLoading && <CircularLoader/>}
            {connected && !subscriptionsLoading && !subscriptionsEnabled && (
                <EmptyState
                    title={Constants.SubscriptionsConfigErrorTitle}
                    subTitle={isCurrentUserSysAdmin ? Constants.SubscriptionsConfigErrorSubtitleForAdmin : Constants.SubscriptionsConfigErrorSubtitleForUser}
                    iconClass='fa fa-unlink'
                    buttonConfig={isCurrentUserSysAdmin ? ({
                        text: 'Download update set',
                        href: `${Utils.getBaseUrls().pluginApiBaseUrl}/download`,
                        download: true,
                    }) : null
                    }
                />
            )}
            {!connected && (
                <EmptyState
                    title='No Account Connected'
                    buttonConfig={{
                        text: 'Connect your account',
                        href: `${Utils.getBaseUrls().pluginApiBaseUrl}/oauth2/connect`,
                    }}
                    iconClass='fa fa-user-circle'
                />
            )}
        </div>
    );
};

export default Rhs;
