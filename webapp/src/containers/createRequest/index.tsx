import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {AutoSuggest, CustomModal as Modal, ModalFooter, ModalHeader, SkeletonLoader} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import {resetGlobalModalState} from 'src/reducers/globalModal';
import {isCreateRequestModalOpen} from 'src/selectors';

import './styles.scss';

// TODO: remove later after integration with the APIs
const requestOptions: RequestData[] = [
    {
        sys_id: 'sys_id 1',
        name: 'name 1',
        short_description: 'desc 1',
        price: 'price 1',
        category: {
            sys_id: 'category 1 sys_id',
            title: 'category 1',
        },
    },
    {
        sys_id: 'sys_id 2',
        name: 'name 2',
        short_description: 'desc 2',
        price: 'price 2',
        category: {
            sys_id: 'category 2 sys_id',
            title: 'category 2',
        },
    },
    {
        sys_id: 'sys_id 3',
        name: 'item 1',
        short_description: 'desc 3',
        price: 'price 3',
        category: {
            sys_id: 'category 3 sys_id',
            title: '',
        },
    },
    {
        sys_id: 'sys_id 4',
        name: 'itme 2',
        short_description: 'desc 4',
        price: 'price 4',
        category: {
            sys_id: 'category 4 sys_id',
            title: '',
        },
    },
];

const CreateRequest = () => {
    const [options, setOptions] = useState<RequestData[]>(requestOptions);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [autoSuggestValue, setAutoSuggestValue] = useState('');
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [request, setRequest] = useState<Record<string, string> | null>(null);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {getApiState, pluginState} = usePluginApi();

    // Errors
    const [apiError, setApiError] = useState<APIError | null>(null);

    const dispatch = useDispatch();

    const hideModal = useCallback(() => {
        setOptions([]);
        setSuggestions([]);
        setAutoSuggestValue('');
        setApiError(null);
        setSuggestionChosen(false);
        setRequest(null);
        dispatch(resetGlobalModalState());
    }, []);

    const mapRequestsToSuggestions = (requests: RequestData[]): Array<Record<string, string>> => requests.map((r) => ({
        id: r.sys_id,
        name: r.name,
        short_description: r.short_description,
        price: r.price,
        title: r.category.title,
        category_id: r.category.sys_id,
    }));

    // Set the suggestions when the input value of the auto-suggest changes
    useEffect(() => {
        const requestsToSuggest = options?.filter((r) => r.name.toLowerCase().includes(autoSuggestValue.toLowerCase())) || [];
        setSuggestions(mapRequestsToSuggestions(requestsToSuggest));
    }, [autoSuggestValue]);

    useEffect(() => {
        // Reset the caller auto-suggest input when the request value is reset
        if (!request) {
            setAutoSuggestValue('');
            setSuggestionChosen(false);
            setRequest(null);
        }
    }, [request]);

    // Set the request when any of the suggestion is selected
    const handleRequestSelection = (requestSuggestion: Record<string, string> | null) => {
        setAutoSuggestValue(requestSuggestion?.name || '');
        setSuggestionChosen(true);
        setRequest(requestSuggestion);
    };

    // Get config state
    const getConfigState = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getConfig.apiServiceName);
        return {isLoading, isSuccess, isError, data: data as ConfigData | undefined, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    const serviceNowBaseURL = getConfigState().data?.ServiceNowBaseURL;

    return (
        <Modal
            show={isCreateRequestModalOpen(pluginState)}
            onHide={hideModal}
            className='rhs-modal'
        >
            <>
                <ModalHeader
                    title='Begin Catalog Request'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                <div
                    className={`padding-h-12 padding-top-25 
                    ${suggestionChosen ? 'height-290' : 'height-120'}`}
                >
                    <AutoSuggest
                        placeholder='Search catalog items'
                        inputValue={autoSuggestValue}
                        onInputValueChange={setAutoSuggestValue}
                        onChangeSelectedSuggestion={handleRequestSelection}
                        disabled={showModalLoader}
                        suggestionConfig={{
                            suggestions,
                            renderValue: (suggestion) => suggestion.name,
                        }}
                        charThresholdToShowSuggestions={Constants.CharThresholdToSuggestRequest}
                    />
                    {suggestionChosen && request && (
                        <>
                            <ul className='search-panel__description margin-top-25 padding-left-15 font-14'>
                                {Constants.RequestDataLabelConfig.map((header) => (
                                    <li
                                        key={header.key}
                                        className='d-flex align-items-center search-panel__description-item margin-bottom-10'
                                    >
                                        <span className='search-panel__description-header margin-right-10 text-ellipsis'>{header.label}</span>
                                        <span className='search-panel__description-text channel-text wt-500 text-ellipsis'>{showModalLoader ? <SkeletonLoader/> : request[header.key] || 'N/A'}</span>
                                    </li>
                                ))}
                            </ul>
                            {serviceNowBaseURL && (
                                <div>
                                    <a
                                        className='color--link btn btn-primary request-button'
                                        href={`${serviceNowBaseURL}/${Constants.REQUEST_BASE_URL}${request.id}`}
                                        rel='noreferrer'
                                        target='_blank'
                                    >
                                        {Constants.RequestButtonText}
                                    </a>
                                    <div className='request-button__redirect-text'>
                                        {Constants.RequestButtonRedirectText}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <ModalFooter
                    onConfirm={hideModal}
                    confirmBtnText='Close'
                    confirmDisabled={showModalLoader}
                />
            </>
        </Modal>
    );
};

export default CreateRequest;
