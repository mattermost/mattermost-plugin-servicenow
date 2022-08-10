import React, {forwardRef, useState, useEffect} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Dropdown from 'components/dropdown';

type AlertTypePanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    alertType: RecordType | null;
    setAlertType: (value: RecordType) => void;
    setResetRecordPanelStates: (reset: boolean) => void;
}

const alertTypeOptions: DropdownOptionType[] = [
    {
        label: 'Incident',
        value: 'incident',
    },
    {
        label: 'Problem',
        value: 'problem',
    },
    {
        label: 'Change Request',
        value: 'change_request',
    },
];

const AlertTypePanel = forwardRef<HTMLDivElement, AlertTypePanelProps>(({
    className,
    error,
    onContinue,
    onBack,
    actionBtnDisabled,
    alertType,
    setAlertType,
    setResetRecordPanelStates,
}: AlertTypePanelProps, alertTypePanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);

    // Hide error state once it the value is valid
    useEffect(() => {
        if (alertType) {
            setValidationFailed(false);
        }
    }, [alertType]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!alertType) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    // Handle change in alert type
    const handleAlertTypeChange = (newValue: RecordType) => {
        setAlertType(newValue);
        setResetRecordPanelStates(true);
    };

    return (
        <div
            className={`modal__body modal-body secondary-panel ${className}`}
            ref={alertTypePanelRef}
        >
            <Dropdown
                placeholder='Select Record Type'
                value={alertType}
                onChange={(newValue) => handleAlertTypeChange(newValue as RecordType)}
                options={alertTypeOptions}
                required={true}
                error={validationFailed && 'Required'}
            />
            <ModalSubTitleAndError error={error}/>
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

export default AlertTypePanel;
