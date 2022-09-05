import React, {useCallback, useEffect} from 'react';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';
import {useDispatch, useSelector} from 'react-redux';

import ToggleSwitch from 'components/toggleSwitch';
import EmptyState from 'components/emptyState';
import SubscriptionCard from 'components/card/subscription';

import Constants, {SubscriptionEvents, SubscriptionTypeLabelMap, SubscriptionEventLabels} from 'plugin_constants';
import {BellIcon} from 'containers/icons';

import usePluginApi from 'hooks/usePluginApi';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';

import Utils from 'utils';

type RhsDataProps = {
    showAllSubscriptions: boolean;
    setShowAllSubscriptions: (show: boolean) => void;
    subscriptions: SubscriptionData[];
    loadingSubscriptions: boolean;
    handleEditSubscription: (subscriptionData: SubscriptionData) => void;
    handleDeleteClick: (subscriptionData: SubscriptionData) => void;
    error?: string;
}

const BulkSubscriptionHeaders: Record<RecordType, string> = {
    incident: 'Incidents',
    problem: 'Problems',
    change_request: 'Change Requests',
};

const RhsData = ({
    showAllSubscriptions,
    setShowAllSubscriptions,
    subscriptions,
    loadingSubscriptions,
    handleEditSubscription,
    handleDeleteClick,
    error,
}: RhsDataProps) => {
    const dispatch = useDispatch();
    const {makeApiRequest, getApiState} = usePluginApi();
    const {currentTeamId} = useSelector((state: GlobalState) => state.entities.teams);

    const getChannelState = useCallback(() => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
        return {isLoading, isSuccess, isError, data: data as ChannelData[], error: ((apiErr as FetchBaseQueryError)?.data as APIError | undefined)?.message};
    }, [getApiState, currentTeamId]);

    const getConfigState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
        return {isLoading, isSuccess, isError, data: data as ConfigData | undefined, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    // Fetch channels to show channel name in the subscription card
    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
    }, [currentTeamId, makeApiRequest]);

    const getSubscriptionCardBody = useCallback((subscription: SubscriptionData): SubscriptionCardBody => ({
        labelValuePairs: [{
            label: 'ID',
            value: subscription.sys_id,
        }],
        list: subscription.subscription_events.split(',').map((event) => SubscriptionEventLabels[event as SubscriptionEvents]),
    }), []);

    const getSubscriptionCardHeader = useCallback((subscription: SubscriptionData): JSX.Element => {
        const isSubscriptionTypeRecord = subscription.type === 'record';
        const header = isSubscriptionTypeRecord ? subscription.number : BulkSubscriptionHeaders[subscription.record_type];
        const serviceNowBaseURL = getConfigState().data?.ServiceNowBaseURL;

        return (
            <>
                {serviceNowBaseURL ? (
                    <a
                        className='color--link'
                        href={Utils.getSubscriptionHeaderLink(serviceNowBaseURL, subscription.type, subscription.record_type, subscription.record_id)}
                        rel='noreferrer'
                        target='_blank'
                    >
                        {header}
                    </a>
                ) : header}
                {isSubscriptionTypeRecord && ` | ${subscription.short_description}`}
            </>
        );
    }, [getConfigState().data?.ServiceNowBaseURL]);

    return (
        <>
            <ToggleSwitch
                active={showAllSubscriptions}
                onChange={setShowAllSubscriptions}
                label={Constants.RhsToggleLabel}
            />
            {error && <p className='rhs-content--error'>{error}</p>}
            {subscriptions?.length > 0 && !loadingSubscriptions && (
                <>
                    <div className='rhs-content__cards-container'>
                        {subscriptions.map((subscription) => (
                            <SubscriptionCard
                                key={subscription.sys_id}
                                header={getSubscriptionCardHeader(subscription)}
                                label={SubscriptionTypeLabelMap[subscription.type]}
                                onEdit={() => handleEditSubscription(subscription)}
                                onDelete={() => handleDeleteClick(subscription)}
                                cardBody={getSubscriptionCardBody(subscription)}
                                channel={showAllSubscriptions ? getChannelState().data.find((ch) => ch.id === subscription.channel_id) : null}
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
            {!subscriptions?.length && !loadingSubscriptions && !error && (
                <EmptyState
                    title='No Subscriptions Found'
                    buttonConfig={{
                        text: 'Add new Subscription',
                        action: () => dispatch(showAddModal()),
                    }}
                    icon={<BellIcon/>}
                />
            )}
        </>
    );
};

export default RhsData;
