import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import ToggleSwitch from 'components/toggleSwitch';

import EmptyState from 'components/emptyState';
import EditSubscription from 'containers/addOrEditSubscriptions/editSubscription';
import SubscriptionCard from 'components/card/subscription';
import CircularLoader from 'components/loader/circular';
import Modal from 'components/modal';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {refetch, resetRefetch} from 'reducers/refetchSubscriptions';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditModal} from 'reducers/editSubscriptionModal';

import './rhs.scss';

// Mock data
const mockSubscriptions: {data: SubscriptionData[]} = {
    data: [{
        server_url: 'http://localhost:8065',
        is_active: true,
        user_id: 'bhy36f7wupy59xydny96s9xrao',
        type: 'record',
        record_type: 'incident',
        record_id: '9d385017c611228701d22104cc95c371',
        subscription_events: 'priority,commented',
        channel_id: '5n4r5bkc6bbgixgyfmjh4oa65c',
        sys_id: '9d385017c611228701d22104cc95c739',
        number: 'INC00010001',
        short_description: 'Test Incident',
    }],
};

const Rhs = (): JSX.Element => {
    const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
    const [editSubscriptionData, setEditSubscriptionData] = useState<EditSubscriptionData | null>(null);
    const dispatch = useDispatch();
    const [fetchSubscriptionParams, setFetchSubscriptionParams] = useState<FetchSubscriptionsParams | null>(null);
    const pluginState = useSelector((state: PluginState) => state);
    const {state: APIState, makeApiRequest, getApiState} = usePluginApi();
    const refetchSubscriptions = pluginState['plugins-mattermost-plugin-servicenow'].refetchSubscriptionsReducer.refetchSubscriptions;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [toBeDeleted, setToBeDeleted] = useState<null | DeleteSubscriptionPayload>(null);
    const [invalidDeleteApi, setInvalidDeleteApi] = useState(true);

    // Get record data state
    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    // Get delete feed state
    const getDeleteSubscriptionState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as DeleteSubscriptionPayload);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    const subscriptionsState = getSubscriptionsState();

    // Fetch subscriptions from the API
    useEffect(() => {
        const params: FetchSubscriptionsParams = {page: 1, per_page: 100};
        if (!showAllSubscriptions) {
            params.channel_id = currentChannelId;
        }
        setFetchSubscriptionParams(params);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, params);
    }, [showAllSubscriptions]);

    // Fetch subscriptions from the API when refetch is set
    useEffect(() => {
        if (!refetchSubscriptions) {
            return;
        }
        const params: FetchSubscriptionsParams = {page: 1, per_page: 100};
        if (!showAllSubscriptions) {
            params.channel_id = currentChannelId;
        }
        setFetchSubscriptionParams(params);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, params);
        dispatch(resetRefetch());
    }, [refetchSubscriptions]);

    // Delete when a feed gets deleted
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

        // Disabling the react-hooks/exhaustive-deps rule at the next line because if we include "getApiState" in the dependency array, the useEffect runs infinitely.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [APIState, invalidDeleteApi]);

    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = (subscription: SubscriptionData) => {
        const subscriptionData: EditSubscriptionData = {
            channel: subscription.channel_id,
            recordId: subscription.record_id,
            alertType: subscription.record_type as RecordType,
            stateChanged: subscription.subscription_events.includes(Constants.SubscriptionEvents.state),
            priorityChanged: subscription.subscription_events.includes(Constants.SubscriptionEvents.priority),
            newCommentChecked: subscription.subscription_events.includes(Constants.SubscriptionEvents.commented),
            assignedToChecked: subscription.subscription_events.includes(Constants.SubscriptionEvents.assignedTo),
            assignmentGroupChecked: subscription.subscription_events.includes(Constants.SubscriptionEvents.assignmentGroup),
            id: subscription.sys_id,
        };
        dispatch(showEditModal());
        setEditSubscriptionData(subscriptionData);
    };

    // Handles action when the delete button is clicked
    const handleDeleteClick = (subscription: SubscriptionData) => {
        const deleteFeedPayload : DeleteSubscriptionPayload = {
            id: subscription.sys_id,
        };
        setToBeDeleted(deleteFeedPayload);
        setDeleteConfirmationOpen(true);
    };

    // Handles action when the delete confirmation button is clicked
    const handleDeleteConfirmation = () => {
        makeApiRequest(Constants.pluginApiServiceConfigs.deleteSubscription.apiServiceName, toBeDeleted as DeleteSubscriptionPayload);
    };

    // Handles action when the delete confirmation modal is closed
    const hideDeleteConfirmation = () => {
        setDeleteConfirmationOpen(false);
        setInvalidDeleteApi(true);
        setToBeDeleted(null);
    };

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

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={showAllSubscriptions}
                onChange={(newState) => setShowAllSubscriptions(newState)}
                label={Constants.RhsToggleLabel}
            />
            {/* TODO: Replace "mockSubscriptions" by "subscriptionState" */}
            {(mockSubscriptions.data?.length > 0 && !subscriptionsState.isLoading) && (
                <>
                    <div className='rhs-content__cards-container'>
                        {mockSubscriptions.data?.map((subscription) => (
                            <SubscriptionCard
                                key={subscription.sys_id}
                                header={`${subscription.number} | ${subscription.short_description}`}
                                label={subscription.type === 'record' ? 'Single Record' : 'Bulk Subscription'}
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
            {(!mockSubscriptions.data?.length && !subscriptionsState.isLoading) && (
                <EmptyState
                    title='No Subscriptions Found'
                    buttonConfig={{
                        text: 'Add new Subscription',
                        action: () => dispatch(showAddModal()),
                    }}
                    iconClass='fa fa-bell-slash-o'
                />
            )}
            {/* TODO: Uncomment and update the following during integration */}
            {/* {!active && (
                <EmptyState
                    title='No Account Connected'
                    subTitle='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                    buttonConfig={{
                        text: 'Connect your account',
                        action: () => '',
                    }}
                    iconClass='fa fa-user-circle'
                />
            )} */}
            {editSubscriptionData && <EditSubscription subscriptionData={editSubscriptionData}/>}
            {subscriptionsState.isLoading && <CircularLoader/>}
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
                    error={invalidDeleteApi || getDeleteSubscriptionState().isLoading || !getDeleteSubscriptionState().isError ? '' : getDeleteSubscriptionState().error}
                    confirmBtnClassName='btn-danger'
                >
                    <>
                        <p className='delete-confirmation-modal__text'>{'Are you sure you want to delete the subscription?'}</p>
                    </>
                </Modal>
            )}
        </div>
    );
};

export default Rhs;
