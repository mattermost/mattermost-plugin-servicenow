import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'hooks/usePluginApi';

import {hideModal as hideEditModal} from 'reducers/editSubscriptionModal';

import AddOrEditSubscriptionModal from '../subComponents';

const EditSubscription = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();

    return (
        <AddOrEditSubscriptionModal
            open={pluginState.openEditSubscriptionModalReducer.open}
            close={() => dispatch(hideEditModal())}
            subscriptionData={pluginState.openEditSubscriptionModalReducer.data}
        />
    );
};

export default EditSubscription;
