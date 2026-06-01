// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render} from '@testing-library/react';

import Spinner from 'src/components/spinner';

describe('Spinner', () => {
    const baseProps = {
        extraClass: 'mockClassName',
    };

    it('should match snapshot with correct className', () => {
        const {container} = render(<Spinner {...baseProps}/>);
        expect(container).toMatchSnapshot();
        expect(container.firstChild).toHaveClass(baseProps.extraClass);
    });
});
