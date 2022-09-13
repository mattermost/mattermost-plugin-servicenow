import React, {forwardRef, useState, useEffect} from 'react';

import {ModalSubtitleAndError, ModalFooter, Dropdown} from 'mm-ui-library';

import {RecordTypeLabelMap} from 'plugin_constants';

type RecordTypePanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    recordType: RecordType | null;
    setRecordType: (value: RecordType) => void;
    setResetRecordPanelStates: (reset: boolean) => void;
}

const recordTypeOptions: DropdownOptionType[] = [
    {
        label: RecordTypeLabelMap.incident,
        value: 'incident',
    },
    {
        label: RecordTypeLabelMap.problem,
        value: 'problem',
    },
    {
        label: RecordTypeLabelMap.change_request,
        value: 'change_request',
    },
];

const RecordTypePanel = forwardRef<HTMLDivElement, RecordTypePanelProps>(({
    className,
    error,
    onContinue,
    onBack,
    actionBtnDisabled,
    recordType,
    setRecordType,
    setResetRecordPanelStates,
}: RecordTypePanelProps, recordTypePanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);

    // Hide error state once the value is valid
    useEffect(() => {
        if (recordType) {
            setValidationFailed(false);
        }
    }, [recordType]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!recordType) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    // Handle change in record type
    const handleRecordTypeChange = (newValue: RecordType) => {
        setRecordType(newValue);
        setResetRecordPanelStates(true);
    };

    return (
        <div
            className={`modal__body wizard__secondary-panel ${className}`}
            ref={recordTypePanelRef}
        >
            <div className='padding-h-12 padding-v-20 wizard__body-container'>
                <Dropdown
                    placeholder='Select Record Type'
                    value={recordType}
                    onChange={(newValue) => handleRecordTypeChange(newValue as RecordType)}
                    options={recordTypeOptions}
                    required={true}
                    error={validationFailed && 'Required'}
                />
                <ModalSubtitleAndError error={error}/>
            </div>
            <ModalFooter
                onHide={onBack}
                onConfirm={handleContinue}
                cancelBtnText='Back'
                confirmBtnText='Continue'
                confirmDisabled={actionBtnDisabled}
                cancelDisabled={actionBtnDisabled}
            />
        </div>
    );
});

export default RecordTypePanel;
