/**
 * Utils
 */

import React from 'react';

import {Button} from '@brightscout/mattermost-ui-library';

import Constants, {SubscriptionType, RecordType, CONNECT_ACCOUNT_LINK} from 'src/plugin_constants';

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
const debounce: (func: (args: Record<string, string>) => void, limit: number) => (args: Record<string, string>) => void = (
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

export default {
    getBaseUrls,
    debounce,
    getSubscriptionHeaderLink,
    onPressingEnterKey,
    getResultPanelHeader,
};
