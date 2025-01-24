// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, useState, useEffect} from 'react';

import {ModalSubtitleAndError, ModalFooter, Dropdown} from '@brightscout/mattermost-ui-library';

import Constants, {RecordType} from 'src/plugin_constants';

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
    showFooter?: boolean;
    placeholder?: string;
    recordTypeOptions: DropdownOptionType[];
}

const RecordTypePanel = forwardRef<HTMLDivElement, RecordTypePanelProps>(({
    className,
    error,
    onContinue,
    onBack,
    actionBtnDisabled,
    recordType,
    setRecordType,
    setResetRecordPanelStates,
    showFooter = false,
    placeholder,
    recordTypeOptions,
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
            className={className}
            ref={recordTypePanelRef}
        >
            <div className={`padding-h-12 ${showFooter ? 'padding-v-20 wizard__body-container' : 'padding-top-20'}`}>
                <Dropdown
                    placeholder={placeholder || 'Select Record Type'}
                    value={recordType}
                    onChange={(newValue) => handleRecordTypeChange(newValue as RecordType)}
                    options={recordTypeOptions}
                    required={true}
                    error={validationFailed && Constants.RequiredMsg}
                />
                <ModalSubtitleAndError error={error}/>
            </div>
            {showFooter && (
                <ModalFooter
                    onHide={onBack}
                    onConfirm={handleContinue}
                    cancelBtnText='Back'
                    confirmBtnText='Continue'
                    confirmDisabled={actionBtnDisabled}
                    cancelDisabled={actionBtnDisabled}
                />
            )}
        </div>
    );
});

export default RecordTypePanel;
