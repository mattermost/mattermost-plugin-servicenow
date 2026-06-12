// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import IconButton from 'src/components/Buttons/iconButton';

describe('IconButton', () => {
    const baseProps = {
        tooltipText: 'mockTooltip',
    };

    it('should match snapshot with only tooltip text provided', () => {
        const {container} = render(<IconButton {...baseProps}/>);
        expect(container).toMatchSnapshot();
    });

    it('should match snapshot with all the props', async () => {
        const props = {
            ...baseProps,
            iconClassName: 'mockIconClassName',
            extraClass: 'mockExtraClass',
            onClick: jest.fn(),
            children: (<></>),
        };
        const {container} = render(<IconButton {...props}/>);
        expect(container).toMatchSnapshot();

        const button = screen.getByRole('button', {name: props.tooltipText});
        expect(button).toHaveClass(props.extraClass);
        expect(button.querySelector('i')).toHaveClass(props.iconClassName);

        await userEvent.click(button);
        expect(props.onClick).toHaveBeenCalled();
    });
});
