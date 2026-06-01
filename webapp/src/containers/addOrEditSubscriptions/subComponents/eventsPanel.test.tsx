// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render} from '@testing-library/react';

import {RecordType, RecordTypeLabelMap, SubscriptionEvents, SubscriptionType} from 'src/plugin_constants';

import EventsPanel from './eventsPanel';

const mockSubscriptionEvents: SubscriptionEvents[] = [];

const mockChannel: DropdownOptionType = {
    label: 'mockChannelLabel',
    value: 'mockChannelValue',
};

const eventsPanelProps = {
    className: 'mockClassName',
    onBack: jest.fn(),
    onContinue: jest.fn(),
    continueBtnDisabled: true,
    backBtnDisabled: true,
    recordType: RecordType.INCIDENT,
    subscriptionEvents: mockSubscriptionEvents,
    setSubscriptionEvents: jest.fn(),
    channel: mockChannel,
};

describe('Events Panel', () => {
    it('renders with the passed className on the root element', () => {
        const {container} = render(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.RECORD}
                record='mockRecord'
                error='mockError'
            />,
        );
        expect(container).toMatchSnapshot();
        expect(container.firstChild).toHaveClass(eventsPanelProps.className);
    });

    it('renders summary text for RECORD subscriptions', () => {
        const {container} = render(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.RECORD}
                record='mockRecord'
                error='mockError'
            />,
        );
        const text = container.textContent || '';
        expect(text).toContain('Channel');
        expect(text).toContain(eventsPanelProps.channel.label);
        expect(text).toContain('Record');
        expect(text).toContain('mockRecord');
        expect(text).toContain('Available events:');
    });

    it('renders record type label for BULK subscriptions when no record is set', () => {
        const {container} = render(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.BULK}
                record=''
            />,
        );
        const text = container.textContent || '';
        expect(text).toContain('Channel');
        expect(text).toContain(eventsPanelProps.channel.label);
        expect(text).toContain('Record type');
        expect(text).toContain(RecordTypeLabelMap[eventsPanelProps.recordType]);
        expect(text).toContain('Available events:');
    });

    it('shows the error text when error prop is provided', () => {
        const {getByText} = render(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.RECORD}
                record='mockRecord'
                error='mockError'
            />,
        );
        expect(getByText('mockError')).toBeInTheDocument();
    });

    it('does not render the error text when error prop is empty', () => {
        const {queryByText} = render(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.RECORD}
                record='mockRecord'
            />,
        );
        expect(queryByText('mockError')).toBeNull();
    });
});
