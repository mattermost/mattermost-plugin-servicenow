import React, {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import {CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, ModalSubtitleAndError} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'hooks/usePluginApi';

import {hideModal as hideUpdateStateModal} from 'reducers/updateStateModal';

const stateOptions: DropdownOptionType[] = [
    {
        label: 'New',
        value: '1',
    },
    {
        label: 'In Progress',
        value: '2',
    },
    {
        label: 'On Hold',
        value: '3',
    },
    {
        label: 'Resolved and edited',
        value: '6',
    },
    {
        label: 'Closed',
        value: '7',
    },
    {
        label: 'Canceled and edited',
        value: '8',
    },
];

const UpdateState = () => {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {pluginState} = usePluginApi();

    const dispatch = useDispatch();

    const hideModal = useCallback(() => {
        setSelectedState(null);
        dispatch(hideUpdateStateModal());
    }, []);

    return (
        <Modal
            show={pluginState.openUpdateStateModalReducer.open}
            onHide={hideModal}
            className={'rhs-modal'}
        >
            <>
                <ModalHeader
                    title={'Update State'}
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <div className={'padding-h-12 padding-v-20 wizard__body-container'}>
                    <Dropdown
                        placeholder={'Select State'}
                        value={selectedState}
                        onChange={setSelectedState}
                        options={stateOptions}
                        required={true}
                    />
                    <ModalSubtitleAndError error={''}/>
                </div>
                <ModalFooter
                    onConfirm={hideModal}
                    confirmBtnText={'Update'}
                    confirmDisabled={showModalLoader || !selectedState}
                    onHide={hideModal}
                    cancelBtnText={'Cancel'}
                    cancelDisabled={showModalLoader}
                />
            </>
        </Modal>
    );
};

export default UpdateState;
