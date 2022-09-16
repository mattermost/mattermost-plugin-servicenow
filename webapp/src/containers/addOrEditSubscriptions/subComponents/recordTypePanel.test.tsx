import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import RecordTypePanel from './recordTypePanel';

const mockOnContinue = jest.fn();
const mockOnBack = jest.fn();
const mockSetRecordType = jest.fn();
const mockSetResetRecordPanelStates = jest.fn();

const mockRecordType: RecordType = 'incident';

const recordTypePanelProps = {
    className: 'mockClassName',
    error: 'mockError',
    onBack: mockOnBack,
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    requiredFieldValidationErr: true,
    recordType: mockRecordType,
    setRecordType: mockSetRecordType,
    setResetRecordPanelStates: mockSetResetRecordPanelStates,
};

describe('Record Type Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    beforeEach(() => {
        component = shallow(<RecordTypePanel {...recordTypePanelProps}/>);
    });

    afterEach(() => {
        component.unmount();
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
});
