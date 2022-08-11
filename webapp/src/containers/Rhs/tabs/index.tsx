import React, {useState} from 'react';

import Tabs from 'components/tabs';
import AutoSuggest from 'components/AutoSuggest';

import './tabs.scss';

// Mock data
const suggestions = [
    'Suggestion1',
    'Suggestion2',
    'Suggestion3',
    'Suggestion4',
    'Suggestion5',
];

const Rhs = (): JSX.Element => {
    const [inputValue, setInputValue] = useState('');
    const tabData: TabData[] = [
        {
            title: 'Current Channel Subscriptions',
            tabPanel: <>
                <AutoSuggest
                    placeholder='Please enter some value'
                    inputValue={inputValue}
                    onInputValueChange={(newValue) => setInputValue(newValue)}
                    suggestions={suggestions}
                    charThresholdToShowSuggestions={4}
                    loadingSuggestions={true}
                />
                <AutoSuggest
                    placeholder='Please enter some value'
                    inputValue={inputValue}
                    onInputValueChange={(newValue) => setInputValue(newValue)}
                    suggestions={[]}
                    charThresholdToShowSuggestions={4}
                />
                <AutoSuggest
                    placeholder='Please enter some value'
                    inputValue={inputValue}
                    onInputValueChange={(newValue) => setInputValue(newValue)}
                    suggestions={suggestions}
                    charThresholdToShowSuggestions={4}
                    disabled={true}
                />
            </>,
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
