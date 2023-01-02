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

    it('should match snapshot when filter icon is present', () => {
        const wrapper = shallow(
            <RHSHeader
                {...baseProps}
                showFilterIcon={true}
            />);

        expect(wrapper).toMatchSnapshot();
        expect(wrapper.text().includes('Subscriptions')).toBeTruthy();
        expect(wrapper.find('ToggleSwitch').exists()).toBeFalsy();
        expect(wrapper.find('MenuButtons').exists()).toBeFalsy();

        wrapper.find('IconButton').first().simulate('click');
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('ToggleSwitch').exists()).toBeTruthy();
        expect(wrapper.find('Dropdown')).toHaveLength(1);
        expect(wrapper.find('Button')).toHaveLength(2);

        wrapper.find('IconButton').last().simulate('click');
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('div').last().hasClass('rhs-filter-popover rhs-menu-popover'));
        expect(wrapper.find('MenuButtons').exists()).toBeTruthy();

        wrapper.find('Button').first().simulate('click');
        expect(baseProps.setShowAllSubscriptions).toBeCalled();
        expect(baseProps.setFilter).toBeCalled();
        expect(baseProps.setResetFilter).toBeCalled();
    });

    it('should match snapshot when filter icon is not present', () => {
        const wrapper = shallow(
            <RHSHeader
                {...baseProps}
                showFilterIcon={false}
            />);

        expect(wrapper).toMatchSnapshot();
        expect(wrapper.text().includes('Subscriptions')).toBeTruthy();
        expect(wrapper.find('ToggleSwitch').exists()).toBeFalsy();
        expect(wrapper.find('MenuButtons').exists()).toBeFalsy();

        wrapper.find('IconButton').first().simulate('click');
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('div').last().hasClass('rhs-filter-popover rhs-menu-popover'));
        expect(wrapper.find('MenuButtons').exists()).toBeTruthy();
        expect(wrapper.find('ToggleSwitch').exists()).toBeFalsy();
        expect(wrapper.find('Dropdown')).toHaveLength(0);
        expect(wrapper.find('Button')).toHaveLength(0);
    });
});
