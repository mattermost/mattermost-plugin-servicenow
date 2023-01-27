/**
 * Utils
 */

import React from 'react';

import {Button} from '@brightscout/mattermost-ui-library';

import Constants, {SubscriptionType, RecordType, CONNECT_ACCOUNT_LINK, SubscriptionEventsMap, SubscriptionEvents, DefaultIncidentImpactAndUrgencyOptions, KeysContainingLink, TypesContainingLink, SupportedFilters, SupportedFiltersMap} from 'src/plugin_constants';

import {id as pluginId} from '../manifest';

const getBaseUrls = (): {
    pluginApiBaseUrl: string;
    mattermostApiBaseUrl: string;
    publicFilesUrl: string;
} => {
    const url = new URL(window.location.href);
    const baseUrl = `${url.protocol}//${url.host}`;
    const pluginUrl = `${baseUrl}/plugins/${pluginId}`;
    const pluginApiBaseUrl = `${pluginUrl}/api/v1`;
    const mattermostApiBaseUrl = `${baseUrl}/api/v4`;
    const publicFilesUrl = `${pluginUrl}/public/`;

    return {pluginApiBaseUrl, mattermostApiBaseUrl, publicFilesUrl};
};

/**
 * Uses closure functionality to implement debouncing
 * @param {function} func Function on which debouncing is to be applied
 * @param {number} limit The time limit for debouncing, the minimum pause in function calls required for the function to be actually called
 * @returns {(args: Array<any>) => void} a function with debouncing functionality applied on it
 */
const debounce: (func: (args: Record<string, string>, type?: string) => void, limit: number) => (args: Record<string, string>) => void = (
    func: (args: Record<string, string>) => void,
    limit: number,
): (args: Record<string, string>) => void => {
    let timer: NodeJS.Timeout;

    /**
     * This is to use the functionality of closures so that timer isn't reinitialized once initialized
     * @param {Array<any>} args
     * @returns {void}
     */

    // eslint-disable-next-line func-names
    return function(args: Record<string, string>): void {
        clearTimeout(timer);
        timer = setTimeout(() => func({...args}), limit);
    };
};

const getSubscriptionHeaderLink = (serviceNowBaseUrl: string, subscriptionType: SubscriptionType, recordType: RecordType, recordId: string): string => (
    subscriptionType === SubscriptionType.RECORD ?
        `${serviceNowBaseUrl}/nav_to.do?uri=${recordType}.do%3Fsys_id=${recordId}%26sysparm_stack=${recordType}_list.do%3Fsysparm_query=active=true` :
        `${serviceNowBaseUrl}/nav_to.do?uri=${recordType}_list.do%3Fsysparm_query=active=true`
);

export const onPressingEnterKey = (event: React.KeyboardEvent<HTMLSpanElement> | React.KeyboardEvent<SVGSVGElement>, func: () => void) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    func();
};

export const getLinkData = (value: string): LinkData => {
    const data = value.split(']');
    return ({
        display_value: data[0].slice(1),
        link: data[1].slice(1, -1),
    });
};

const getContentForResultPanelWhenDisconnected = (message: string, onClick: () => void) => (
    <>
        <h2 className='font-16 margin-v-25 text-center'>{message}</h2>
        <a
            target='_blank'
            rel='noreferrer'
            href={getBaseUrls().pluginApiBaseUrl + CONNECT_ACCOUNT_LINK}
        >
            <Button
                text='Connect your account'
                onClick={onClick}
            />
        </a>
    </>
);

const getResultPanelHeader = (error: APIError | null, onClick: () => void, successMessage?: string) => {
    if (error) {
        return error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired ?
            getContentForResultPanelWhenDisconnected(error.message, onClick) :
            error.message;
    }

    return successMessage;
};

const getCommandArgs = (command: string): string[] => {
    const myRegexp = /[^\s"]+|"([^"]*)"/gi;
    const myArray = [];
    let match;
    do {
        match = myRegexp.exec(command);
        if (match != null) {
            myArray.push(match[1] || match[0]);
        }
    } while (match != null);

    return myArray.length > 2 ? myArray.slice(2) : [];
};

const getSubscriptionEvents = (subscription_events: string): SubscriptionEvents[] => {
    const events = subscription_events.split(',');
    return events.map((event) => SubscriptionEventsMap[event]);
};

// Returns value for record data header
const getRecordValueForHeader = (key: TypesContainingLink, value?: string | LinkData): string | JSX.Element | null => {
    if (!value) {
        return null;
    } else if (typeof value === 'string') {
        if (value === Constants.EmptyFieldsInServiceNow || !KeysContainingLink.has(key)) {
            return value;
        }

        const data: LinkData = getLinkData(value);
        return (
            <a
                href={data.link}
                target='_blank'
                rel='noreferrer'
                className='btn btn-link padding-0'
            >
                <div className='shared-posts__field-value'>{data.display_value}</div>
            </a>
        );
    }

    return null;
};

const getImpactAndUrgencyOptions = (
    setImpactOptions: React.Dispatch<React.SetStateAction<DropdownOptionType[]>>,
    setUrgencyOptions: React.Dispatch<React.SetStateAction<DropdownOptionType[]>>,
    data: IncidentFieldsData[],
) => {
    const impactOptions = data.filter((item) => item.element === 'impact');
    const urgencyOptions = data.filter((item) => item.element === 'urgency');
    setImpactOptions(impactOptions.length ? impactOptions : DefaultIncidentImpactAndUrgencyOptions);
    setUrgencyOptions(urgencyOptions.length ? urgencyOptions : DefaultIncidentImpactAndUrgencyOptions);
};

const getFormattedFilters = (filters: FiltersData[]) => {
    if (!filters) {
        return '';
    }

    let formattedFilters = '';
    filters.map((filter) => {
        if (filter.filterValue) {
            formattedFilters += SupportedFiltersMap[filter.filterType as SupportedFilters] + ':';
            formattedFilters += '"' + filter.filterValue + '",';
        }

        return formattedFilters;
    });

    if (formattedFilters) {
        formattedFilters = '{' + formattedFilters.slice(0, -1) + '}';
    }

    return formattedFilters;
};

export default {
    getBaseUrls,
    debounce,
    getSubscriptionHeaderLink,
    onPressingEnterKey,
    getLinkData,
    getResultPanelHeader,
    getCommandArgs,
    getSubscriptionEvents,
    getRecordValueForHeader,
    getImpactAndUrgencyOptions,
    getFormattedFilters,
};
