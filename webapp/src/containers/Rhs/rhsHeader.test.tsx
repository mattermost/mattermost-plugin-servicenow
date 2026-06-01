// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RHSHeader from './rhsHeader';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
}));

describe('RHSHeader', () => {
    const baseProps = {
        showFilterIcon: true,
        showAllSubscriptions: false,
        setShowAllSubscriptions: jest.fn(),
        filter: {createdBy: 'mockUser'},
        setFilter: jest.fn(),
        setResetFilter: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders header and opens filter popover with toggle, then resets', async () => {
        const {container} = render(<RHSHeader {...baseProps}/>);
        expect(container).toMatchSnapshot();

        expect(container.querySelector('.rhs-filter-popover')).toBeNull();

        await userEvent.click(screen.getByRole('button', {name: /share/i}));
        expect(mockDispatch).toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', {name: 'Filter'}));
        expect(container).toMatchSnapshot();
        expect(container.querySelector('.rhs-filter-popover')).not.toBeNull();

        await userEvent.click(screen.getByRole('button', {name: /reset/i}));
        expect(baseProps.setShowAllSubscriptions).toHaveBeenCalled();
        expect(baseProps.setFilter).toHaveBeenCalled();
        expect(baseProps.setResetFilter).toHaveBeenCalled();
    });
});
