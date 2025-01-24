// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useDispatch} from 'react-redux';

import usePluginApi from 'src/hooks/usePluginApi';

import {resetGlobalModalState} from 'src/reducers/globalModal';
import {getGlobalModalState, isEditSubscriptionModalOpen} from 'src/selectors';

import AddOrEditSubscriptionModal from '../subComponents';

const EditSubscription = () => {
    const dispatch = useDispatch();
    const {pluginState} = usePluginApi();

    return (
        <AddOrEditSubscriptionModal
            open={isEditSubscriptionModalOpen(pluginState)}
            close={() => dispatch(resetGlobalModalState())}
            subscriptionData={getGlobalModalState(pluginState).data as EditSubscriptionData}
        />
    );
};

export default EditSubscription;
