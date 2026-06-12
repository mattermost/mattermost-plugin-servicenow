// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {render} from '@testing-library/react';

import Constants, {RecordType} from 'src/plugin_constants';

import RecordTypePanel from './recordTypePanel';

const recordTypePanelProps = {
    className: 'mockClassName',
    onBack: jest.fn(),
    onContinue: jest.fn(),
    actionBtnDisabled: true,
    requiredFieldValidationErr: true,
    recordType: RecordType.INCIDENT,
    setRecordType: jest.fn(),
    setResetRecordPanelStates: jest.fn(),
    recordTypeOptions: Constants.recordTypeOptions,
};

describe('Record Type Panel', () => {
    it('renders with the passed className on the root element', () => {
        const {container} = render(
            <RecordTypePanel
                {...recordTypePanelProps}
                error='mockError'
                showFooter={true}
            />,
        );
        expect(container).toMatchSnapshot();
        expect(container.firstChild).toHaveClass(recordTypePanelProps.className);
    });

    it('shows the error text when error prop is provided', () => {
        const {getByText} = render(
            <RecordTypePanel
                {...recordTypePanelProps}
                error='mockError'
                showFooter={true}
            />,
        );
        expect(getByText('mockError')).toBeInTheDocument();
    });

    it('does not render the error text when error prop is empty', () => {
        const {queryByText} = render(
            <RecordTypePanel
                {...recordTypePanelProps}
                showFooter={true}
            />,
        );
        expect(queryByText('mockError')).toBeNull();
    });
});
