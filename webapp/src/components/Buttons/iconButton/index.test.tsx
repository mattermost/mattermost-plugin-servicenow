import React from 'react';
import {shallow} from 'enzyme';

import IconButton from 'components/Buttons/iconButton';

describe('IconButton', () => {
    const baseProps = {
        tooltipText: 'mockTooltip',
    };

    it('should match snapshot with only tooltip text provided', () => {
        const wrapper = shallow(<IconButton {...baseProps}/>);
        expect(wrapper).toMatchSnapshot();
    });

    it('should match snapshot with all the props', () => {
        const props = {
            ...baseProps,
            iconClassName: 'mockIconClassName',
            extraClass: 'mockExtraClass',
            onClick: jest.fn(),
            children: (<></>),
        };
        const wrapper = shallow(<IconButton {...props}/>);
        expect(wrapper).toMatchSnapshot();

        expect(wrapper.find('Button').hasClass(props.extraClass)).toBeTruthy();
        expect(wrapper.find('i').hasClass(props.iconClassName)).toBeTruthy();
        wrapper.find('Button').simulate('click');
        expect(props.onClick).toHaveBeenCalled();
    });
});
