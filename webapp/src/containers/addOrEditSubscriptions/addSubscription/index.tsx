import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';
import {resetCurrentModalState} from 'src/reducers/currentModal';
import {isAddSubscriptionModalOpen} from 'src/selectors';

import AddOrEditSubscriptionModal from '../subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();

    return (
        <AddOrEditSubscriptionModal
            open={isAddSubscriptionModalOpen(pluginState)}
            close={() => dispatch(resetCurrentModalState())}
        />
    );
};

export default AddSubscriptions;
