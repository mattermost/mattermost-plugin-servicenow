import React from 'react';
import {shallow} from 'enzyme';
import * as redux from 'react-redux';

import RHSHeader from './rhsHeader';

describe('RHSHeader', () => {
    const baseProps = {
        showAllSubscriptions: false,
        setShowAllSubscriptions: jest.fn(),
        filter: {createdBy: 'mockUser'},
        setFilter: jest.fn(),
        setResetFilter: jest.fn(),
    };

    // Mock useDispatch hook
    const spyOnUseDispatch = jest.spyOn(redux, 'useDispatch');

    // Mock dispatch function returned from useDispatch
    const mockDispatch = jest.fn();
    spyOnUseDispatch.mockReturnValue(mockDispatch);

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should match snapshot', () => {
        const wrapper = shallow(<RHSHeader {...baseProps}/>);

        expect(wrapper).toMatchSnapshot();
        wrapper.find('button').simulate('click');
        expect(mockDispatch).toBeCalled();

        wrapper.find('IconButton').simulate('click');
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('Dropdown').exists()).toBeTruthy();
        expect(wrapper.find('Button')).toHaveLength(2);

        wrapper.find('Button').first().simulate('click');
        expect(baseProps.setFilter).toBeCalled();
    });
});
