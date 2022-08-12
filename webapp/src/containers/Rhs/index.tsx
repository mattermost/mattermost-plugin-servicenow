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

const Rhs = (): JSX.Element => {
    const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
    const [editSubscriptionData, setEditSubscriptionData] = useState<EditSubscriptionData | null>(null);
    const dispatch = useDispatch();
    const [fetchSubscriptionParams, setFetchSubscriptionParams] = useState<FetchSubscriptionsParams | null>(null);
    const pluginState = useSelector((state: PluginState) => state);
    const {makeApiRequest, getApiState} = usePluginApi();
    const refetchSubscriptions = pluginState['plugins-mattermost-plugin-servicenow'].refetchSubscriptionsReducer.refetchSubscriptions;
    const {currentChannelId} = useSelector((state: GlobalState) => state.entities.channels);

    // Get record data state
    const getSubscriptionsState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.fetchSubscriptions.apiServiceName, fetchSubscriptionParams as FetchSubscriptionsParams);
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
    }, [refetchSubscriptions, showAllSubscriptions]);

    // TODO: Update this accordingly when integrating edit subscription API
    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = () => {
        // Dummy data
        const subscriptionData: EditSubscriptionData = {
            channel: 'WellValue1',
            recordValue: 'Record 3',
            alertType: 'change_request',
            stateChanged: true,
            priorityChanged: false,
            newCommentChecked: true,
            assignedToChecked: true,
            assignmentGroupChecked: false,
        };
        dispatch(showEditModal());
        setEditSubscriptionData(subscriptionData);
    };

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={showAllSubscriptions}
                onChange={(newState) => setShowAllSubscriptions(newState)}
                label={Constants.RhsToggleLabel}
            />
            {(subscriptionsState.data?.length > 0 && !subscriptionsState.isLoading) && (
                <>
                    <div className='rhs-content__cards-container'>
                        {subscriptionsState.data?.map((subscription) => (
                            <SubscriptionCard
                                key={subscription.sys_id}
                                header={subscription.sys_id}
                                label={subscription.record_type === 'record' ? 'Single Record' : 'Bulk Record'}
                                onEdit={handleEditSubscription}

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
            {(!subscriptionsState.data?.length && !subscriptionsState.isLoading) && (
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
