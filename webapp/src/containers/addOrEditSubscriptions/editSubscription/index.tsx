import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';
import {resetCurrentModalState} from 'src/reducers/currentModal';
import {getCurrentModalState, isEditSubscriptionModalOpen} from 'src/selectors';

import AddOrEditSubscriptionModal from '../subComponents';

const EditSubscription = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();
    const {data} = getCurrentModalState(pluginState);
    const subscriptionData = typeof (data) === 'string' ? data as string : data as EditSubscriptionData;

    return (
        <AddOrEditSubscriptionModal
            open={isEditSubscriptionModalOpen(pluginState)}
            close={() => dispatch(resetCurrentModalState())}
            subscriptionData={subscriptionData}
        />
    );
};

export default EditSubscription;
