import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import {ModalSubtitleAndError} from '@brightscout/mattermost-ui-library';

import Constants, {RecordType} from 'plugin_constants';

import RecordTypePanel from './recordTypePanel';

const mockOnContinue = jest.fn();
const mockOnBack = jest.fn();
const mockSetRecordType = jest.fn();
const mockSetResetRecordPanelStates = jest.fn();

const recordTypePanelProps = {
    className: 'mockClassName',
    onBack: mockOnBack,
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    requiredFieldValidationErr: true,
    recordType: RecordType.INCIDENT,
    setRecordType: mockSetRecordType,
    setResetRecordPanelStates: mockSetResetRecordPanelStates,
    recordTypeOptions: Constants.recordTypeOptions,
};

describe('Record Type Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    beforeEach(() => {
        component = shallow(
            <RecordTypePanel
                {...recordTypePanelProps}
                error={'mockError'}
                showFooter={true}
            />);
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should apply the passed className prop', () => {
        expect(component.hasClass(recordTypePanelProps.className)).toBeTruthy();
    });

    it('Should render the record type panel body correctly', () => {
        expect(component.find('Dropdown')).toHaveLength(1);
        expect(component.find('ModalSubtitleAndError')).toHaveLength(1);
        expect(component.find('ModalFooter')).toHaveLength(1);
    });

    it('Should render the record type panel body correctly when show footer is "false"', () => {
        component = shallow(
            <RecordTypePanel
                {...recordTypePanelProps}
                error={'mockError'}
            />);
        expect(component.find('Dropdown')).toHaveLength(1);
        expect(component.find('ModalSubtitleAndError')).toHaveLength(1);
        expect(component.find('ModalFooter')).toHaveLength(0);
    });

    it('Should render the error correctly', () => {
        expect(component.contains(
            <ModalSubtitleAndError error={'mockError'}/>,
        )).toBeTruthy();
    });

    it('Should not render the error, if error is not passed', () => {
        expect(component.contains(
            <ModalSubtitleAndError/>,
        )).toBeFalsy();
    });

    it('Should fire change event when dropdown value is changed', () => {
        const changeDropdown = (changeNumber: number) => {
            component.find('Dropdown').simulate('change');
            expect(recordTypePanelProps.setRecordType).toHaveBeenCalledTimes(changeNumber);
            expect(recordTypePanelProps.setResetRecordPanelStates).toHaveBeenCalledTimes(changeNumber);
        };

        // Click the checkbox
        changeDropdown(1);
        changeDropdown(2);
    });
});
