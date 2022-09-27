import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';

import {shallow, ShallowWrapper} from 'enzyme';

import AddSubscriptions from '.';

describe('Add Subscriptions', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <AddSubscriptions/>
            </Provider>,
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should render the edit subscription body correctly', () => {
        expect(component.find('AddOrEditSubscriptionModal')).toBeTruthy();
    });
});
