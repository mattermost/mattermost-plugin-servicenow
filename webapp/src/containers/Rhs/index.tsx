import React, {useState} from 'react';

import {useDispatch} from 'react-redux';

import ToggleSwitch from 'components/toggleSwitch';

// TODO: Uncomment while adding empty state
// import EmptyState from 'components/emptyState';
import EditSubscription from 'containers/addOrEditSubscriptions/editSubscription';
import SubscriptionCard from 'components/card/subscription';
import Constants from 'plugin_constants';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';
import {showModal as showEditModal} from 'reducers/editSubscriptionModal';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const [active, setActive] = useState(false);
    const [editSubscriptionData, setEditSubscriptionData] = useState<EditSubscriptionData | null>(null);
    const dispatch = useDispatch();

    // TODO: Update this accordingly when integrating edit subscription API
    // Handles action when edit button is clicked for a subscription
    const handleEditSubscription = () => {
        // Dummy data
        const subscriptionData: EditSubscriptionData = {
            channel: 'WellValue1',
            recordValue: 'Record 3',
            alertType: 'change_request',
            stateChanged: true,
            priorityChanged: false,
            newCommentChecked: true,
            assignedToChecked: true,
            assignmentGroupChecked: false,
        };
        dispatch(showEditModal());
        setEditSubscriptionData(subscriptionData);
    };

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label={Constants.RhsToggleLabel}
            />
            {/* TODO: Update the following when fetch subscriptions API is integrated */}
            <SubscriptionCard
                header='9034ikser82u389irjho239w3'
                label='Single Record'
                description='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                onEdit={handleEditSubscription}
                onDelete={() => ''}
            />
            {/* TODO: Uncomment and update the follwing during integration */}
            {/* {active && (
                <EmptyState
                    title='No Subscriptions Found'
                    subTitle='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                    buttonConfig={{
                        text: 'Add new Subscription',
                        action: () => '',
                    }}
                    iconClass='fa fa-bell-slash-o'
                />
            )} */}
            {/* TODO: Uncomment and update the following during integration */}
            {/* {!active && (
                <EmptyState
                    title='No Account Connected'
                    subTitle='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                    buttonConfig={{
                        text: 'Connect your account',
                        action: () => '',
                    }}
                    iconClass='fa fa-user-circle'
                />
            )} */}
            <div className='rhs-btn-container'>
                <button
                    className='btn btn-primary rhs-btn'
                    onClick={() => dispatch(showAddModal())}
                >
                    {'Add Subscription'}
                </button>
            </div>
            {editSubscriptionData && <EditSubscription subscriptionData={editSubscriptionData}/>}
        </div>
    );
};

export default Rhs;
