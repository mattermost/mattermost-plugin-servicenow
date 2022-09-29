import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import {ModalFooter, ModalSubtitleAndError} from '@brightscout/mattermost-ui-library';

import {RecordType, RecordTypeLabelMap, SubscriptionEvents, SubscriptionType} from 'plugin_constants';

import EventsPanel from './eventsPanel';

const mockOnContinue = jest.fn();
const mockOnBack = jest.fn();
const mockSetSubscriptionEvents = jest.fn();

const mockSubscriptionEvents: SubscriptionEvents[] = [];

const mockChannel: DropdownOptionType = {
    label: 'mockChannelLabel',
    value: 'mockChannelValue',
};

const eventsPanelProps = {
    className: 'mockClassName',
    error: 'mockError',
    onBack: mockOnBack,
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    recordType: RecordType.INCIDENT,
    subscriptionEvents: mockSubscriptionEvents,
    setSubscriptionEvents: mockSetSubscriptionEvents,
    channel: mockChannel,
};

describe('Events Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    beforeEach(() => {
        component = shallow(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.RECORD}
                record={'mockRecord'}
            />);
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should apply the passed className prop', () => {
        expect(component.hasClass(eventsPanelProps.className)).toBeTruthy();
    });

    it('Should render the events panel body correctly', () => {
        expect(component.find('Checkbox')).toHaveLength(5);
        expect(component.find('ModalSubtitleAndError')).toHaveLength(1);
        expect(component.find('ModalFooter')).toHaveLength(1);
    });

    it('Should render the events panel body correctly when subscription type is BULK', () => {
        component = shallow(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.BULK}
                record={'mockRecord'}
            />);
        expect(component.find('Checkbox')).toHaveLength(6);
        expect(component.find('ModalSubtitleAndError')).toHaveLength(1);
        expect(component.find('ModalFooter')).toHaveLength(1);
    });

    it('Should render the events panel text correctly', () => {
        expect(component.text().includes('Channel')).toBeTruthy();
        expect(component.text().includes(`${eventsPanelProps.channel.label}`)).toBeTruthy();
        expect(component.text().includes('Record')).toBeTruthy();
        expect(component.text().includes('mockRecord')).toBeTruthy();
        expect(component.text().includes('Available events:')).toBeTruthy();
    });

    it('Should render the events panel text correctly on not having record and subscription type BULK', () => {
        component = shallow(
            <EventsPanel
                {...eventsPanelProps}
                subscriptionType={SubscriptionType.BULK}
                record={''}
            />);
        expect(component.text().includes('Channel')).toBeTruthy();
        expect(component.text().includes(`${eventsPanelProps.channel.label}`)).toBeTruthy();
        expect(component.text().includes('Record type')).toBeTruthy();
        expect(component.text().includes(RecordTypeLabelMap[eventsPanelProps.recordType])).toBeTruthy();
        expect(component.text().includes('Available events:')).toBeTruthy();
    });

    it('Should render the error correctly', () => {
        expect(component.contains(
            <ModalSubtitleAndError error={eventsPanelProps.error}/>,
        )).toBeTruthy();
    });

    it('Should render the footer correctly', () => {
        expect(component.contains(
            <ModalFooter
                onHide={eventsPanelProps.onBack}
                onConfirm={eventsPanelProps.onContinue}
                confirmBtnText='Continue'
                cancelBtnText='Back'
                confirmDisabled={eventsPanelProps.actionBtnDisabled}
                cancelDisabled={eventsPanelProps.actionBtnDisabled}
            />,
        )).toBeTruthy();
    });

    it('Should fire change event when clicked', () => {
        const clickCheckbox = (clickNumber: number, checked: boolean) => {
            // eslint-disable-next-line max-nested-callbacks
            component.find('Checkbox').forEach((node) => node.simulate('change', {target: {checked}}));
            expect(eventsPanelProps.setSubscriptionEvents).toHaveBeenCalledTimes(clickNumber);
        };

        // Click the checkbox
        clickCheckbox(5, true);
        clickCheckbox(10, false);
    });
});
