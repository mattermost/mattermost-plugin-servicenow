import React, {forwardRef, useEffect, useState} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Dropdown from 'components/dropdown';

type ChannelPanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    actionBtnDisabled?: boolean;
    channel: string | null;
    setChannel: (value: string | null) => void;
}

export const ChannelDropdownOptions: DropdownOptionType[] = [
    {
        label: (
            <span>
                <i className='fa fa-globe dropdown-option-icon'/>
                {'Channel1'}
            </span>
        ),
        value: 'WellValue1',
    },
    {
        label: (
            <span>
                <i className='fa fa-globe dropdown-option-icon'/>
                {'Channel2'}
            </span>
        ),
        value: 'WellValue2',
    },
    {
        label: (
            <span>
                <i className='fa fa-globe dropdown-option-icon'/>
                {'Channel3'}
            </span>
        ),
        value: 'WellValue3',
    },
    {
        label: (
            <span>
                <i className='fa fa-globe dropdown-option-icon'/>
                {'Channel4'}
            </span>
        ),
        value: 'WellValue4',
    },
];

const ChannelPanel = forwardRef<HTMLDivElement, ChannelPanelProps>(({
    className,
    error,
    onContinue,
    actionBtnDisabled,
    channel,
    setChannel,
}: ChannelPanelProps, channelPanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);

    // Hide error state once it the value is valid
    useEffect(() => {
        if (channel) {
            setValidationFailed(false);
        }
    }, [channel]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!channel) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    return (
        <div
            className={`modal__body modal-body channel-panel ${className}`}
            ref={channelPanelRef}
        >
            <Dropdown
                placeholder='Select Channel'
                value={channel}
                onChange={(newValue) => setChannel(newValue)}
                options={ChannelDropdownOptions}
                required={true}
                error={validationFailed && 'Required'}
            />
            <ModalSubTitleAndError error={error}/>
            <ModalFooter
                onConfirm={handleContinue}
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default ChannelPanel;
