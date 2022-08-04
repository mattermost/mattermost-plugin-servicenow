import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import ToggleSwitch from 'components/toggleSwitch';
import Modal from 'components/modal';
import EmptyState from 'components/emptyState';

import {showModal as showAddModal} from 'reducers/addSubscriptionModal';
import {hideModal as hideEditModal} from 'reducers/editSubscriptionModal';

import './rhs.scss';

const Rhs = (): JSX.Element => {
    const [active, setActive] = useState(false);
    const pluginState = useSelector((state: PluginState) => state);
    const dispatch = useDispatch();

    return (
        <div className='rhs-content'>
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label='Show all subscriptions'
            />
            {/* TODO: Remove the follwing during integration */}
            {active && (
                <EmptyState
                    title='No Subscriptions Found'
                    subTitle='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                    buttonConfig={{
                        text: 'Add new Subscription',
                        action: () => '',
                    }}
                    iconClass='fa fa-bell-slash-o'
                />
            )}
            {/* TODO: Remove the following during integration */}
            {!active && (
                <EmptyState
                    title='No Account Connected'
                    subTitle='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Adipiscing nulla in tellus est mauris et eros.'
                    buttonConfig={{
                        text: 'Connect your account',
                        action: () => '',
                    }}
                    iconClass='fa fa-user-circle'
                />
            )}
            <div className='rhs-btn-container'>
                <button
                    className='btn btn-primary rhs-btn'
                    onClick={() => dispatch(showAddModal())}
                >
                    {'Add Subscription'}
                </button>
            </div>
            <Modal
                show={pluginState['plugins-mattermost-plugin-servicenow']?.openEditSubscriptionModalReducer?.open || false}
                onHide={() => dispatch(hideEditModal())}
                title='Edit subscription'
                confirmBtnText='Edit'
                onConfirm={() => dispatch(hideEditModal())}

                // If these classes are updated, please also update the query in the "setModalDialogHeight" function which is defined above.
                className='rhs-modal edit-feed-modal'
            >
                <h4>{'Test Edit Modal'}</h4>
            </Modal>
        </div>
    );
};

export default Rhs;
