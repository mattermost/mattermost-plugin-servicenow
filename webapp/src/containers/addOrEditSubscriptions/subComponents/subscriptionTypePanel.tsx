import React, {forwardRef, useState, useEffect} from 'react';

import ModalSubTitleAndError from 'components/modal/subComponents/modalSubtitleAndError';
import ModalFooter from 'components/modal/subComponents/modalFooter';
import Dropdown from 'components/dropdown';

import {SubscriptionType, SubscriptionTypeLabelMap} from 'plugin_constants';

type SubscriptionTypePanelProps = {
    className?: string;
    error?: string;
    onContinue?: () => void;
    onBack?: () => void;
    actionBtnDisabled?: boolean;
    requiredFieldValidationErr?: boolean;
    subscriptionType: SubscriptionType | null;
    setSubscriptionType: (value: SubscriptionType) => void;
}

const subscriptionTypeOptions: DropdownOptionType[] = [
    {
        label: SubscriptionTypeLabelMap[SubscriptionType.RECORD],
        value: SubscriptionType.RECORD,
    },
    {
        label: SubscriptionTypeLabelMap[SubscriptionType.BULK],
        value: SubscriptionType.BULK,
    },
];

const SubscriptionTypePanel = forwardRef<HTMLDivElement, SubscriptionTypePanelProps>(({
    className,
    error,
    onContinue,
    onBack,
    actionBtnDisabled,
    subscriptionType,
    setSubscriptionType,
}: SubscriptionTypePanelProps, subscriptionTypePanelRef): JSX.Element => {
    const [validationFailed, setValidationFailed] = useState(false);

    // Hide error state once the value is valid
    useEffect(() => {
        if (subscriptionType) {
            setValidationFailed(false);
        }
    }, [subscriptionType]);

    // Handle action when the continue button is clicked
    const handleContinue = () => {
        if (!subscriptionType) {
            setValidationFailed(true);
            return;
        }

        if (onContinue) {
            onContinue();
        }
    };

    return (
        <div
            className={`modal__body modal-body secondary-panel ${className}`}
            ref={subscriptionTypePanelRef}
        >
            <Dropdown
                placeholder='Select Subscription Type'
                value={subscriptionType}
                onChange={(newValue) => setSubscriptionType(newValue as SubscriptionType)}
                options={subscriptionTypeOptions}
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

export default SubscriptionTypePanel;
