import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {hideModal as hideEditModal} from 'reducers/editSubscriptionModal';

import AddOrEditSubscriptionModal from '../subComponents';

type EditSubscriptionProps = {
    subscriptionData: EditSubscriptionData;
}

const EditSubscription = ({subscriptionData}: EditSubscriptionProps) => {
    const dispatch = useDispatch();
    const pluginState = useSelector((state: PluginState) => state['plugins-mattermost-plugin-servicenow']);

    // TODO: Add the logic for checking if the user is connected first
    return (
        <AddOrEditSubscriptionModal
            open={pluginState.openEditSubscriptionModalReducer.open}
            close={() => dispatch(hideEditModal())}
            subscriptionData={subscriptionData}
        />
    );
};

export default EditSubscription;
