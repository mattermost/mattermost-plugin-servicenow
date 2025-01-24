// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';
import * as redux from 'react-redux';

import RHSHeader from './rhsHeader';

describe('RHSHeader', () => {
    const baseProps = {
        showFilterIcon: true,
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
        expect(wrapper.find('ToggleSwitch').exists()).toBeFalsy();
        wrapper.find('button').simulate('click');
        expect(mockDispatch).toBeCalled();

        wrapper.find('IconButton').simulate('click');
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('ToggleSwitch').exists()).toBeTruthy();

        wrapper.find('Button').first().simulate('click');
        expect(baseProps.setShowAllSubscriptions).toBeCalled();
        expect(baseProps.setFilter).toBeCalled();
        expect(baseProps.setResetFilter).toBeCalled();
    });
});
