import React from 'react';
import {shallow} from 'enzyme';

import Spinner from 'components/spinner';

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
