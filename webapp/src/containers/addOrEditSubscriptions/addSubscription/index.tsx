import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';

import {resetGlobalModalState} from 'src/reducers/globalModal';
import {isAddSubscriptionModalOpen} from 'src/selectors';

import AddOrEditSubscriptionModal from '../subComponents';

const AddSubscriptions = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();

    return (
        <AddOrEditSubscriptionModal
            open={isAddSubscriptionModalOpen(pluginState)}
            close={() => dispatch(resetGlobalModalState())}
        />
    );
};

export default AddSubscriptions;
