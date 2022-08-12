import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import ToggleSwitch from 'components/toggleSwitch';
import Constants, {ToggleSwitchLabelPositioning} from 'plugin_constants';
import Modal from 'components/modal';
import SubscriptionCard from 'components/card/subscription';

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
                label={Constants.RhsToggleLabel}
            />
            <ToggleSwitch
                active={active}
                onChange={(newState) => setActive(newState)}
                label={Constants.RhsToggleLabel}
                labelPositioning={ToggleSwitchLabelPositioning.Right}
            />
            <SubscriptionCard

                // TODO: Update props after the API gets integrated
                header='82ojwerise8r9w3r8u9lkjsoer93iose'
                label='Single Record'
                description='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ultricies cursus tempor consectetur augue senectus felis maecenas facilisis massa.'
                onDelete={() => ''}
                onEdit={() => ''}
            />
            <SubscriptionCard

                // TODO: Update props after the API gets integrated
                header='82ojwerise8r9w3r8u9lkjsoer93'
                label='Bulk Record'
                cardBody={[
                    {
                        label: 'Channel Slug Name',
                        value: 'Town Square',
                    },
                ]}
                description='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ultricies cursus tempor consectetur augue senectus felis maecenas facilisis massa.'
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
