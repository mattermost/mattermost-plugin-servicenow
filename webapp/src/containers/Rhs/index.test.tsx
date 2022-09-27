import React from 'react';
import {Provider} from 'react-redux';

import {shallow, ShallowWrapper} from 'enzyme';

import {configureStore} from '../../../tests/setup';
import Rhs from '.';

describe('Search Record Panel', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
    const initialState = {};
    const mockStore = configureStore();

    beforeEach(() => {
        const store = mockStore(initialState);
        component = shallow(
            <Provider store={store}>
                <Rhs/>
            </Provider>,
        );
    });

    afterEach(() => {
        component.unmount();
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should render the rhs body correctly', () => {
        expect(component.find('Rhs')).toHaveLength(1);
    });
});
