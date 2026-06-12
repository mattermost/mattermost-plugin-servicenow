// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render} from '@testing-library/react';

import {SubscriptionType} from 'src/plugin_constants';

import SubscriptionTypePanel from './subscriptionTypePanel';

const subscriptionTypePanelProps = {
    className: 'mockClassName',
    onBack: jest.fn(),
    onContinue: jest.fn(),
    actionBtnDisabled: true,
    requiredFieldValidationErr: true,
    subscriptionType: SubscriptionType.RECORD,
    setSubscriptionType: jest.fn(),
};

describe('Subscription Type Panel', () => {
    it('renders with the passed className on the root element', () => {
        const {container} = render(
            <SubscriptionTypePanel
                {...subscriptionTypePanelProps}
                error='mockError'
            />,
        );
        expect(container).toMatchSnapshot();
        expect(container.firstChild).toHaveClass(subscriptionTypePanelProps.className);
    });

    it('shows the error text when error prop is provided', () => {
        const {getByText} = render(
            <SubscriptionTypePanel
                {...subscriptionTypePanelProps}
                error='mockError'
            />,
        );
        expect(getByText('mockError')).toBeInTheDocument();
    });

    it('does not render the error text when error prop is empty', () => {
        const {queryByText} = render(
            <SubscriptionTypePanel
                {...subscriptionTypePanelProps}
            />,
        );
        expect(queryByText('mockError')).toBeNull();
    });
});
