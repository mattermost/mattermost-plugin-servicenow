import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import ToggleSwitch from 'components/toggleSwitch';

import EmptyState from 'components/emptyState';
import EditSubscription from 'containers/addOrEditSubscriptions/editSubscription';
import SubscriptionCard from 'components/card/subscription';
import CircularLoader from 'components/loader/circular';

import usePluginApi from 'hooks/usePluginApi';

import Constants from 'plugin_constants';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditModal} from 'reducers/editSubscriptionModal';

import './rhs.scss';

// Mock data
const mockSubscriptions = {
    data: [{
        server_url: 'http://localhost:8065',
        is_active: true,
        user_id: 'bhy36f7wupy59xydny96s9xrao',
        type: 'record',
        record_type: 'incident',
        record_id: '9d385017c611228701d22104cc95c371',
        subscription_events: 'priority, commented',
        channel_id: '5n4r5bkc6bbgixgyfmjh4oa65c',
        sys_id: '9d385017c611228701d22104cc95c739',
    }],
};

const Rhs = (): JSX.Element => {
    const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
    const [editSubscriptionData, setEditSubscriptionData] = useState<EditSubscriptionData | null>(null);
    const dispatch = useDispatch();
    const [fetchSubscriptionParams, setFetchSubscriptionParams] = useState<FetchSubscriptionsParams | null>(null);
    const pluginState = useSelector((state: PluginState) => state);
    const {makeApiRequest, getApiState} = usePluginApi();
    const refetchSubscriptions = pluginState['plugins-mattermost-plugin-servicenow'].refetchSubscriptionsReducer.refetchSubscriptions;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);

    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
        return {isLoading, isSuccess, isError, data: data as SubscriptionData[], error: ((apiErr as FetchBaseQueryError)?.data) as string};
    };

    const subscriptionsState = getSubscriptionsState();

    // Fetch subscriptions from the API
    useEffect(() => {
        const params: FetchSubscriptionsParams = {page: Constants.DefaultPage, per_page: Constants.DefaultPageSize};
        if (!showAllSubscriptions) {
            params.channel_id = currentChannelId;
        }
        setFetchSubscriptionParams(params);
        makeApiRequest(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, params);
    }, [refetchSubscriptions, showAllSubscriptions]);

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

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={showAllSubscriptions}
                onChange={setShowAllSubscriptions}
                label={Constants.RhsToggleLabel}
            />
            {/* TODO: Replace "mockSubscriptions" by "subscriptionState" */}
            {(mockSubscriptions.data?.length > 0 && !subscriptionsState.isLoading) && (
                <>
                    <div className='rhs-content__cards-container'>
                        {mockSubscriptions.data.map((subscription) => (
                            <SubscriptionCard
                                key={subscription.sys_id}
                                header={subscription.sys_id}
                                label={subscription.type === 'record' ? 'Single Record' : 'Bulk Record'}
                                onEdit={() => handleEditSubscription(subscription)}

                                // TODO: Update following when the delete functionality has been integrated
                                onDelete={() => ''}
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
        </div>
    );
};

export default Rhs;
