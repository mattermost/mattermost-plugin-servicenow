import React from 'react';
import {Provider} from 'react-redux';

import {shallow, ShallowWrapper} from 'enzyme';

import {configureStore} from '../../../../tests/setup';

import ChannelPanel from './channelPanel';

const mockOnContinue = jest.fn();
const mockSetApiError = jest.fn();
const mockSetApiResponseValid = jest.fn();
const mockSetShowModalLoader = jest.fn();
const mockSetChannel = jest.fn();
const mockSetChannelOptions = jest.fn();

const mockChannelOptions: DropdownOptionType[] = [{
    label: 'Channel 1',
    value: 'Channel 1',
}, {
    label: 'Channel 2',
    value: 'Channel 2',
}, {
    label: 'Channel 3',
    value: 'Channel 3',
}];

const channelPanelProps = {
    className: 'mockClassName',
    error: 'mockError',
    onContinue: mockOnContinue,
    actionBtnDisabled: true,
    setApiError: mockSetApiError,
    setApiResponseValid: mockSetApiResponseValid,
    setShowModalLoader: mockSetShowModalLoader,
    channel: 'mockChannel',
    setChannel: mockSetChannel,
    channelOptions: mockChannelOptions,
    setChannelOptions: mockSetChannelOptions,
};

describe('Channel Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <ChannelPanel {...channelPanelProps}/>
            </Provider>,
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    // it('Should apply the passed className prop', () => {
    //     expect(component.find(ChannelPanel).hasClass(channelPanelProps.className)).toBeTruthy();
    // });

    // it('Should render the events panel body correctly', () => {
    //     expect(component.find(".Dropdown")).toHaveLength(1);
    // });

    // it('Should render the error correctly', () => {
    //     expect(component.contains(
    //         <ModalSubtitleAndError error={channelPanelProps.error}/>,
    //     )).toBeTruthy();
    // });
});
