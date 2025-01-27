// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Spinner from 'src/components/spinner';

describe('Spinner', () => {
    const baseProps = {
        extraClass: 'mockClassName',
    };

    it('should match snapshot with correct className', () => {
        const wrapper = shallow(<Spinner {...baseProps}/>);
        expect(wrapper).toMatchSnapshot();
        expect(wrapper.find('div').hasClass(baseProps.extraClass)).toBeTruthy();
    });
});
