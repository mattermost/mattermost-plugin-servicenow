import React, {useCallback, useEffect, useMemo} from 'react';
import {GlobalState} from 'mattermost-redux/types/store';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';
import {useDispatch, useSelector} from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';

import {ToggleSwitch, EmptyState, SubscriptionCard, BellIcon, SvgWrapper} from '@brightscout/mattermost-ui-library';

import Spinner from 'components/spinner';

import Constants, {SubscriptionEvents, SubscriptionType, RecordType, SubscriptionTypeLabelMap, SubscriptionEventLabels} from 'plugin_constants';
import SVGIcons from 'plugin_constants/icons';

import usePluginApi from 'hooks/usePluginApi';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';

import Utils from 'utils';
import {showModal as showRecordModal} from 'reducers/shareRecordModal';

type RhsDataProps = {
    showAllSubscriptions: boolean;
    setShowAllSubscriptions: (show: boolean) => void;
    totalSubscriptions: SubscriptionData[];
    loadingSubscriptions: boolean;
    handleEditSubscription: (subscriptionData: SubscriptionData) => void;
    handleDeleteClick: (subscriptionData: SubscriptionData) => void;
    error?: string;
    isCurrentUserSysAdmin: boolean;
    paginationQueryParams: PaginationQueryParams;
    handlePagination: () => void;
}

// TODO: Add proper type here
const BulkSubscriptionHeaders: Record<string, string> = {
    [RecordType.INCIDENT]: 'Incidents',
    [RecordType.PROBLEM]: 'Problems',
    [RecordType.CHANGE_REQUEST]: 'Change Requests',
};

const RhsData = ({
    showAllSubscriptions,
    setShowAllSubscriptions,
    totalSubscriptions,
    loadingSubscriptions,
    handleEditSubscription,
    handleDeleteClick,
    error,
    isCurrentUserSysAdmin,
    paginationQueryParams,
    handlePagination,
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

    const hasMoreSubscriptions = useMemo<boolean>(() => (
        (totalSubscriptions.length - (paginationQueryParams.page * Constants.DefaultPageSize) === Constants.DefaultPageSize)
    ), [totalSubscriptions]);

    const getSubscriptionCardHeader = useCallback((subscription: SubscriptionData): JSX.Element => {
        const isSubscriptionTypeRecord = subscription.type === SubscriptionType.RECORD;
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
            <div className='rhs-content__header'>
                <span className='rhs-content__subscriptions'>{Constants.RhsSubscritpions}</span>
                <button
                    className='btn btn-primary share-record-btn'
                    onClick={() => dispatch(showRecordModal())}
                >
                    <span>
                        <SvgWrapper
                            width={16}
                            height={16}
                            viewBox='0 0 14 12'
                            className='share-record-icon'
                        >
                            {SVGIcons.share}
                        </SvgWrapper>
                    </span>
                    {Constants.ShareRecordButton}
                </button>
            </div>
            <ToggleSwitch
                active={showAllSubscriptions}
                onChange={setShowAllSubscriptions}
                label={Constants.RhsToggleLabel}
            />
            {error && (
                <EmptyState
                    title={Constants.GeneralErrorMessage}
                    subTitle={isCurrentUserSysAdmin ? Constants.GeneralErrorSubtitleForAdmin : Constants.GeneralErrorSubtitleForUser}
                    iconClass='fa fa-exclamation-triangle err-icon'
                    className='error-state'
                />
            )}
            <div
                id='scrollableArea'
                className='rhs-content__cards-container'
            >
                {totalSubscriptions.length > 0 && (
                    <InfiniteScroll
                        dataLength={totalSubscriptions.length}
                        next={handlePagination}
                        hasMore={hasMoreSubscriptions}
                        loader={<Spinner/>}
                        endMessage={
                            <p className='text-center'>
                                <b>{Constants.NoSubscriptionPresent}</b>
                            </p>
                        }
                        scrollableTarget='scrollableArea'
                    >
                        <>
                            {totalSubscriptions.map((subscription) => (
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
                            <div className='rhs-btn-container padding-12 channel-bg'>
                                <button
                                    className='btn btn-primary rhs-btn plugin-btn'
                                    onClick={() => dispatch(showAddModal())}
                                >
                                    {'Add Subscription'}
                                </button>
                            </div>
                        </>
                    </InfiniteScroll>
                )}
                {!totalSubscriptions.length && !loadingSubscriptions && !error && (
                    <EmptyState
                        title='No Subscriptions Found'
                        buttonConfig={{
                            text: 'Add new Subscription',
                            action: () => dispatch(showAddModal()),
                        }}
                        icon={<BellIcon/>}
                    />
                )}
            </div>
        </>
    );
};

export default RhsData;
