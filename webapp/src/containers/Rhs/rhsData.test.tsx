import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import {configureStore} from '../../../tests/setup';
import RhsData from './rhsData';
import { Provider } from 'react-redux';

const mockSetShowAllSubscriptions = jest.fn();
const mockHandleDeleteClick = jest.fn();
const mockHandleEditSubscription = jest.fn();

const rhsDataProps = {
    error: 'mockError',
    showAllSubscriptions: true,
    setShowAllSubscriptions: mockSetShowAllSubscriptions,
    subscriptions: [],
    loadingSubscriptions: true,
    isCurrentUserSysAdmin: true,
    handleDeleteClick: mockHandleDeleteClick,
    handleEditSubscription: mockHandleEditSubscription
};

describe('Search Record Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <RhsData {...rhsDataProps}/>
            </Provider>,
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should render the rhs data body correctly', () => {
        expect(component.find(RhsData)).toHaveLength(1);
    });
});
