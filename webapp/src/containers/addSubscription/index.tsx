import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {hideModal as hideAddModal} from 'reducers/addSubscriptionModal';

import AddSubscriptionModal from './subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const pluginState = useSelector((state: PluginState) => state['plugins-mattermost-plugin-servicenow']);

    return (
        <AddSubscriptionModal
            open={pluginState.openAddSubscriptionModalReducer.open}
            close={() => dispatch(hideAddModal())}
        />
    );
};

export default AddSubscriptions;
