import React, {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CustomModal as Modal, Dropdown, ModalFooter, ModalHeader, TextArea} from '@brightscout/mattermost-ui-library';

import Input from '@brightscout/mattermost-ui-library/build/cjs/components/InputField';

import usePluginApi from 'src/hooks/usePluginApi';

import {hideModal as hideCreateIncidentModal} from 'src/reducers/incidentModal';

import Constants, {IncidentImpactAndUrgencyOptions} from 'src/plugin_constants';

import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import CallerPanel from './callerPanel';

import './styles.scss';

const channelDropDownOptions: DropdownOptionType[] = [
    {
        label: 'Channel 1',
        value: '1',
    },
    {
        label: 'Channel 2',
        value: '2',
    },
    {
        label: 'Channel 3',
        value: '3',
    },
];

const UpdateState = () => {
    const [shortDescription, setShortDescription] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [impact, setImpact] = useState<string | null>(null);
    const [urgency, setUrgency] = useState<string | null>(null);
    const [caller, setCaller] = useState<string | null>(null);
    const [channel, setChannel] = useState<string | null>(null);
    const [channelOptions, setChannelOptions] = useState<DropdownOptionType[]>(channelDropDownOptions);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {pluginState} = usePluginApi();

    // Errors
    const [apiError, setApiError] = useState<APIError | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const dispatch = useDispatch();

    const hideModal = useCallback(() => {
        setShortDescription('');
        setDescription('');
        setImpact(null);
        setUrgency(null);
        setCaller(null);
        setChannel(null);
        setChannelOptions([]);
        setApiError(null);
        setValidationError(null);
        dispatch(hideCreateIncidentModal());
    }, []);

    const onShortDescriptionChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShortDescription(e.target.value);
        setValidationError('');
    };

    const onDescriptionChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    const createIncident = () => {
        if (!shortDescription) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        hideModal();
    };

    return (
        <Modal
            show={pluginState.openIncidentModalReducer.open}
            onHide={hideModal}
            className='rhs-modal'
        >
            <>
                <ModalHeader
                    title='Create an incident'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <div className='incident-body'>
                    <Input
                        placeholder='Short description'
                        value={shortDescription}
                        onChange={onShortDescriptionChangeHandle}
                        error={validationError ?? ''}
                        className='incident-body__input-field'
                    />
                    <TextArea
                        placeholder='Description'
                        value={description}
                        onChange={onDescriptionChangeHandle}
                        className='incident-body__text-area'
                        disabled={showModalLoader}
                    />
                    <Dropdown
                        placeholder='Select impact'
                        value={impact}
                        onChange={setImpact}
                        options={IncidentImpactAndUrgencyOptions}
                        disabled={showModalLoader}
                        className='margin-top-20'
                    />
                    <Dropdown
                        placeholder='Select urgency'
                        value={urgency}
                        onChange={setUrgency}
                        options={IncidentImpactAndUrgencyOptions}
                        disabled={showModalLoader}
                        className='margin-top-20'
                    />
                    <CallerPanel
                        caller={caller}
                        setCaller={setCaller}
                        actionBtnDisabled={showModalLoader}
                        setShowModalLoader={setShowModalLoader}
                        className='incident-body__auto-suggest'
                    />
                    <ChannelPanel
                        channel={channel}
                        setChannel={setChannel}
                        setShowModalLoader={setShowModalLoader}
                        setApiError={setApiError}
                        channelOptions={channelOptions}
                        setChannelOptions={setChannelOptions}
                        actionBtnDisabled={showModalLoader}
                        placeholder='Select channel to create subscription'
                        className='incident-body__auto-suggest'
                    />
                </div>
                <ModalFooter
                    onConfirm={createIncident}
                    confirmBtnText='Create'
                    confirmDisabled={showModalLoader}
                    onHide={hideModal}
                    cancelBtnText='Cancel'
                    cancelDisabled={showModalLoader}
                />
            </>
        </Modal>
    );
};

export default UpdateState;
