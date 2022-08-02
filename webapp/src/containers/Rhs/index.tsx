import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import ToggleSwitch from 'components/toggleSwitch';
import {ToggleSwitchLabelPositioning} from 'plugin_constants';
import Modal from 'components/modal';

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
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label='Show all subscriptions'
                labelPositioning={ToggleSwitchLabelPositioning.Right}
            />
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
