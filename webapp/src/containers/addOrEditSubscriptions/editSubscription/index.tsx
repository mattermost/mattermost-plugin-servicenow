import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';

import {resetGlobalModalState} from 'src/reducers/globalModal';
import {getGlobalModalState, isEditSubscriptionModalOpen} from 'src/selectors';

import AddOrEditSubscriptionModal from '../subComponents';

const EditSubscription = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();
    const {data} = getGlobalModalState(pluginState);
    const subscriptionData = typeof (data) === 'string' ? data as string : data as EditSubscriptionData;

    return (
        <AddOrEditSubscriptionModal
            open={isEditSubscriptionModalOpen(pluginState)}
            close={() => dispatch(resetGlobalModalState())}
            subscriptionData={subscriptionData}
        />
    );
};

export default EditSubscription;
