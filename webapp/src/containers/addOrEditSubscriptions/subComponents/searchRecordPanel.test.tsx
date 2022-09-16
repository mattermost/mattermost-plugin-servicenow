import React from 'react';
import {Provider} from 'react-redux';

import {shallow, ShallowWrapper} from 'enzyme';

import plugin_constants from 'plugin_constants';
import {configureStore} from '../../../../tests/setup';

import SearchRecordsPanel from './searchRecordsPanel';

const mockOnContinue = jest.fn();
const mockOnBack = jest.fn();
const mockSetRecordValue = jest.fn();
const mockSetSuggestionChosen = jest.fn();
const mockSetApiError = jest.fn();
const mockSetApiResponseValid = jest.fn();
const mockSetShowModalLoader = jest.fn();
const mockSetRecordId = jest.fn();
const mockSetResetStates = jest.fn();

const mockRecordType: RecordType = 'incident';

const searchRecordPanelProps = {
    className: 'mockClassName',
    error: 'mockError',
    onBack: mockOnBack,
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    requiredFieldValidationErr: true,
    recordValue: 'mockRecordValue',
    setRecordValue: mockSetRecordValue,
    suggestionChosen: true,
    setSuggestionChosen: mockSetSuggestionChosen,
    recordType: mockRecordType,
    setApiError: mockSetApiError,
    setApiResponseValid: mockSetApiResponseValid,
    setShowModalLoader: mockSetShowModalLoader,
    recordId: 'mockRecordId',
    setRecordId: mockSetRecordId,
    resetStates: true,
    setResetStates: mockSetResetStates,
};

describe('Search Record Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <SearchRecordsPanel {...searchRecordPanelProps}/>
            </Provider>,
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });
});
