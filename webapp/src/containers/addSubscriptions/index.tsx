import React from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {hideModal as hideAddModal} from 'reducers/addSubscriptionModal';

import AddSubscriptionModal from './subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const pluginState = useSelector((state: PluginState) => state);

    return (
        <AddSubscriptionModal
            open={pluginState['plugins-mattermost-plugin-servicenow']?.openAddSubscriptionModalReducer?.open}
            close={() => dispatch(hideAddModal())}
        />
    );
};

export default AddSubscriptions;
