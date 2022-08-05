import React from 'react';

import Tabs from 'components/tabs';

import './tabs.scss';

const Rhs = (): JSX.Element => {
    const tabData: TabData[] = [
        {
            title: 'Current Channel Subscriptions',
            tabPanel: <div>{'Tab Panel 1'}</div>,
        },
        {
            title: 'All Subscriptions',
            tabPanel: <div>{'Tab Panel 2'}</div>,
        },
    ];

    return (
        <Tabs
            tabs={tabData}
            tabsClassName='rhs-tabs'
        />
    );
};

export default Rhs;
