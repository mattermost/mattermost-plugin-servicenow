import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {hideModal as hideAddModal} from 'reducers/addSubscriptionModal';

import AddOrEditSubscriptionModal from '../subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const pluginState = useSelector((state: PluginState) => state);

    // TODO: Add the logic for checking if the user is connected first
    return (
        <AddOrEditSubscriptionModal
            open={pluginState['plugins-mattermost-plugin-servicenow']?.openAddSubscriptionModalReducer?.open}
            close={() => dispatch(hideAddModal())}
        />
    );
};

export default AddSubscriptions;
