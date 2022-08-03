import React from 'react';
import {OverlayTrigger, Popover as BootstrapPopover} from 'react-bootstrap';

import './styles.scss';

type PopoverProps = {
    placement?: 'top' | 'right' | 'bottom' | 'left';
    popoverBody: JSX.Element;
    children: JSX.Element;
    className?: string;
}

const Popover = ({placement = 'bottom', children, popoverBody, className = ''}: PopoverProps): JSX.Element => {
    return (
        <OverlayTrigger
            placement={placement}
            trigger='focus'
            delay={300}
            overlay={
                <BootstrapPopover
                    id='popover'
                    className={className}
                >
                    {popoverBody}
                </BootstrapPopover>
            }
        >
            {children}
        </OverlayTrigger>
    );
};

export default Popover;
