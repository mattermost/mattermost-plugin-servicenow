import React, {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';

import {CustomModal as Modal, InputField as Input, Dropdown, ModalFooter, ModalHeader, TextArea, ToggleSwitch} from '@brightscout/mattermost-ui-library';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants, {IncidentImpactAndUrgencyOptions} from 'src/plugin_constants';

import {resetGlobalModalState} from 'src/reducers/globalModal';
import {isCreateIncidentModalOpen} from 'src/selectors';

import ChannelPanel from 'src/containers/addOrEditSubscriptions/subComponents/channelPanel';

import CallerPanel from './callerPanel';

import './styles.scss';

// TODO: remove after integration with the APIs
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
    const [showChannelPanel, setShowChannelPanel] = useState(false);

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
        setShowChannelPanel(false);
        dispatch(resetGlobalModalState());
    }, []);

    const onShortDescriptionChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShortDescription(e.target.value);
        setValidationError('');
    };

    const onDescriptionChangeHandle = (e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value);

    const createIncident = () => {
        if (!shortDescription) {
            setValidationError(Constants.RequiredMsg);
            return;
        }

        hideModal();
    };

    return (
        <Modal
            show={isCreateIncidentModalOpen(pluginState)}
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
                        required={true}
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
                        className={`incident-body__auto-suggest ${caller && 'incident-body__suggestion-chosen'}`}
                    />
                    <ToggleSwitch
                        active={showChannelPanel}
                        onChange={(active) => setShowChannelPanel(active)}
                        label={Constants.ChannelPanelToggleLabel}
                        labelPositioning='right'
                        className='incident-body__toggle-switch'
                    />
                    {showChannelPanel && (
                        <ChannelPanel
                            channel={channel}
                            setChannel={setChannel}
                            setShowModalLoader={setShowModalLoader}
                            setApiError={setApiError}
                            channelOptions={channelOptions}
                            setChannelOptions={setChannelOptions}
                            actionBtnDisabled={showModalLoader}
                            placeholder='Select channel to create subscription'
                            className={`incident-body__auto-suggest ${channel && 'incident-body__suggestion-chosen'}`}
                        />
                    )}
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
