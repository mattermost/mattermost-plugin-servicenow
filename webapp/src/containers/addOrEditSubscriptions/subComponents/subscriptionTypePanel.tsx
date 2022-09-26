import React, {forwardRef, useState, useEffect} from 'react';

import {ModalSubtitleAndError, ModalFooter, Dropdown} from '@Brightscout/mm-ui-library';

import Constants, {SubscriptionType, SubscriptionTypeLabelMap} from 'plugin_constants';

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
            className={`modal__body wizard__secondary-panel ${className}`}
            ref={subscriptionTypePanelRef}
        >
            <div className='padding-h-12 padding-v-20 subscription-type-panel'>
                <Dropdown
                    placeholder='Select Subscription Type'
                    value={subscriptionType}
                    onChange={(newValue) => setSubscriptionType(newValue as SubscriptionType)}
                    options={subscriptionTypeOptions}
                    required={true}
                    error={validationFailed && Constants.RequiredMsg}
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

export default SubscriptionTypePanel;
