import React, {useCallback, useEffect, useMemo} from 'react';
import {GlobalState} from 'mattermost-webapp/types/store';
import {useDispatch, useSelector} from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';

import {EmptyState, SubscriptionCard, BellIcon, SvgWrapper} from '@brightscout/mattermost-ui-library';

import Chip from 'src/components/chip';
import Spinner from 'src/components/spinner';
import SVGIcons from 'src/plugin_constants/icons';

import Constants, {SubscriptionEvents, SubscriptionType, RecordType, SubscriptionEventLabels, ModalIds, SupportedFiltersLabelsMap, SupportedFilters} from 'src/plugin_constants';

import usePluginApi from 'src/hooks/usePluginApi';

import {setGlobalModalState} from 'src/reducers/globalModal';

import Utils from 'src/utils';

type RhsDataProps = {
    showAllSubscriptions: boolean;
    totalSubscriptions: SubscriptionData[];
    loadingSubscriptions: boolean;
    handleEditSubscription: (subscriptionData: SubscriptionData) => void;
    handleDeleteClick: (subscriptionData: SubscriptionData) => void;
    error?: string;
    isCurrentUserSysAdmin: boolean;
    paginationQueryParams: PaginationQueryParams;
    handlePagination: () => void;
}

type BulkSubscriptionRecordType = Extract<RecordType, RecordType.INCIDENT | RecordType.PROBLEM | RecordType.CHANGE_REQUEST>;
const BulkSubscriptionHeaders: Record<BulkSubscriptionRecordType, string> = {
    [RecordType.INCIDENT]: 'Incidents',
    [RecordType.PROBLEM]: 'Problems',
    [RecordType.CHANGE_REQUEST]: 'Change Requests',
};

const RhsData = ({
    showAllSubscriptions,
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

    const getChannelState = () => {
        const {data} = getApiState(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
        return {data: data as ChannelData[]};
    };

    const getConfigState = () => {
        const {data} = getApiState(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
        return {data: data as ConfigData | undefined};
    };

    // Fetch channels to show channel name in the subscription card
    useEffect(() => {
        if (showAllSubscriptions) {
            makeApiRequest(Constants.pluginApiServiceConfigs.getChannels.apiServiceName, {teamId: currentTeamId});
        }
    }, [showAllSubscriptions]);

    const getSubscriptionCardBody = useCallback((subscription: SubscriptionData): SubscriptionCardBody => ({
        labelValuePairs: [{
            label: 'ID',
            value: subscription.sys_id,
        }],
        filters: subscription.filters_data && getSubscriptionCardFilters(subscription.filters_data),
        list: subscription.subscription_events ? subscription.subscription_events.split(',').map((event) => SubscriptionEventLabels[event as SubscriptionEvents]) : [],
    }), []);

    const getSubscriptionCardFilters = (filters_data: FiltersData[]): JSX.Element => (
        <div className='d-flex'>
            <div className='subscription-card__filter-icon'>
                <SvgWrapper
                    width={18}
                    height={12}
                    viewBox='0 0 16 16'
                >
                    {SVGIcons.filter}
                </SvgWrapper>
            </div>
            <div className='subscription-card__chip-wrapper'>
                {filters_data.map((filterData) => (
                    <div key={filterData.filterValue ?? ''}>
                        <Chip
                            text={`${SupportedFiltersLabelsMap[filterData.filterType as SupportedFilters]}: ${filterData.filterName}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const hasMoreSubscriptions = useMemo<boolean>(() => (
        (totalSubscriptions.length - (paginationQueryParams.page * Constants.DefaultPageSize) === Constants.DefaultPageSize)
    ), [totalSubscriptions]);

    const getSubscriptionCardHeader = useCallback((subscription: SubscriptionData): JSX.Element => {
        const isSubscriptionTypeRecord = subscription.type === SubscriptionType.RECORD;
        const header = isSubscriptionTypeRecord ? subscription.number : BulkSubscriptionHeaders[subscription.record_type as BulkSubscriptionRecordType];
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

    const {data} = getChannelState();
    return (
        <>
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
                                    onEdit={() => handleEditSubscription(subscription)}
                                    onDelete={() => handleDeleteClick(subscription)}
                                    cardBody={getSubscriptionCardBody(subscription)}
                                    className='subscription-card'
                                    channel={showAllSubscriptions ? data?.find((ch) => ch.id === subscription.channel_id) : null}
                                />
                            ))}
                            <div className='rhs-btn-container padding-12 channel-bg'>
                                <button
                                    className='btn btn-primary rhs-btn plugin-btn'
                                    onClick={() => dispatch(setGlobalModalState({modalId: ModalIds.ADD_SUBSCRIPTION}))}
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
                            action: () => dispatch(setGlobalModalState({modalId: ModalIds.ADD_SUBSCRIPTION})),
                        }}
                        icon={<BellIcon/>}
                    />
                )}
            </div>
        </>
    );
};

export default RhsData;
