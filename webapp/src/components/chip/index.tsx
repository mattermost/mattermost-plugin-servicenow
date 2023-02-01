import React from 'react';

import {Tooltip} from '@brightscout/mattermost-ui-library';

import './styles.scss';

type ChipProps = {
    text: string
    extraClass?: string
}

const Chip = ({text, extraClass = ''}: ChipProps) => (
    <Tooltip tooltipContent={text}>
        <div className={`servicenow-chip Badge__box ${extraClass}`}>
            {text}
        </div>
    </Tooltip>
);

export default Chip;
