import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {hideModal as hideAddModal} from 'src/reducers/addSubscriptionModal';

import AddOrEditSubscriptionModal from '../subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const pluginState = useSelector((state: PluginState) => state['plugins-mattermost-plugin-servicenow']);

    return (
        <AddOrEditSubscriptionModal
            open={pluginState.openAddSubscriptionModalReducer.open}
            close={() => dispatch(hideAddModal())}
        />
    );
};

export default AddSubscriptions;
