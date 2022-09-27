import React from 'react';

import {shallow, ShallowWrapper} from 'enzyme';

import AddOrEditSubscription from '.';
import { Provider } from 'react-redux';
import { configureStore } from '../../../../tests/setup';

const mockClose = jest.fn();

const mockRecordType: RecordType = 'incident';

const mockType: SubscriptionType = "object"

const mockSubscriptionData = {
    channel: "mockChannel",
    type: mockType,
    recordId: "mockRecordID",
    recordType: mockRecordType,
    subscriptionEvents: [],
    id: "mockID"
}

const addOrEditSubscriptionProps = {
    open: true,
    close : mockClose,
    subscriptionData: mockSubscriptionData
};

describe('Add Or Edit Subscription', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <AddOrEditSubscription {...addOrEditSubscriptionProps}/>
            </Provider>
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should render the radd or edit subscription body correctly', () => {
        expect(component.find('AddOrEditSubscription')).toHaveLength(1);
    });
});
