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
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void
}

const IconButton = ({tooltipText, iconClassName, children, extraClass = '', onClick}: IconButtonProps) => (
    <Tooltip tooltipContent={tooltipText}>
        <Button
            variant='outline-danger'
            className={`plugin-btn servicenow-button-wrapper btn-icon ${extraClass}`}
            onClick={onClick}
            aria-label={tooltipText}
            tabIndex={0}
            onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement> | React.KeyboardEvent<SVGSVGElement>) => onPressingEnterKey(event, () => onClick?.())}
        >
            {iconClassName && <i className={iconClassName}/>}
            {children}
        </Button>
    </Tooltip>
);

export default IconButton;
