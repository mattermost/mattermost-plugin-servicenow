// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Button} from 'react-bootstrap';

import {Tooltip} from '@brightscout/mattermost-ui-library';

import {onPressingEnterKey} from 'src/utils';

import './styles.scss';

type IconButtonProps = {
    iconClassName?: string
    tooltipText: string
    children?: React.ReactNode
    extraClass?: string
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void
};

const IconButton = ({tooltipText, iconClassName, children, extraClass = '', onClick}: IconButtonProps) => {
    // react-bootstrap's types describe the Button component rather than the element it renders.
    const handleClick = (event: React.MouseEvent<unknown>) => onClick?.(event as React.MouseEvent<HTMLElement>);

    return (
        <Tooltip tooltipContent={tooltipText}>
            <Button
                className={`plugin-btn servicenow-button-wrapper btn-icon ${extraClass}`}
                onClick={handleClick}
                aria-label={tooltipText}
                tabIndex={0}
                onKeyDown={(event) => onPressingEnterKey(event, () => onClick?.())}
            >
                {iconClassName && <i className={iconClassName}/>}
                {children}
            </Button>
        </Tooltip>
    );
};

export default IconButton;
