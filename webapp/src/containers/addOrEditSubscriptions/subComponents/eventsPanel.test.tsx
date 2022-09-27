import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import EventsPanel from './eventsPanel';
import {SubscriptionEvents} from 'plugin_constants';
import {ModalFooter, ModalSubtitleAndError} from 'mm-ui-library';

const mockOnContinue = jest.fn();
const mockOnBack = jest.fn();
const mockSetSubscriptionEvents = jest.fn();

const mockSubscriptionEvents: SubscriptionEvents[] = [];

const mockRecordType: RecordType = 'incident';
const mockChannel: DropdownOptionType = {
    label: 'mockChannelLabel',
    value: 'mockChannelValue',
}

const eventsPanelProps = {
    className: 'mockClassName',
    error: 'mockError',
    onBack: mockOnBack,
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    record : "mockRecord",
    recordType: mockRecordType,
    subscriptionEvents: mockSubscriptionEvents,
    setSubscriptionEvents :mockSetSubscriptionEvents,
    channel: mockChannel
};

describe('Events Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    beforeEach(() => {
        component = shallow(<EventsPanel {...eventsPanelProps}/>);
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
            component.find('Checkbox').forEach(node => node.simulate('change', {target: {checked}}));
            expect(eventsPanelProps.setSubscriptionEvents).toHaveBeenCalledTimes(clickNumber);
        };

        // Click the checkbox
        clickCheckbox(5, true);
        clickCheckbox(10, false);
    });
});
