import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {AutoSuggest, CustomModal as Modal, ModalFooter, ModalHeader, ResultPanel, SkeletonLoader} from '@brightscout/mattermost-ui-library';

import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import usePluginApi from 'src/hooks/usePluginApi';

import Constants from 'src/plugin_constants';

import {setConnected} from 'src/reducers/connectedState';
import {resetGlobalModalState} from 'src/reducers/globalModal';
import {isCreateRequestModalOpen} from 'src/selectors';

import Utils from 'src/utils';

import './styles.scss';

const CreateRequest = () => {
    const [options, setOptions] = useState<RequestData[]>([]);
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [autoSuggestValue, setAutoSuggestValue] = useState('');
    const [suggestionChosen, setSuggestionChosen] = useState(false);
    const [request, setRequest] = useState<Record<string, string> | null>(null);
    const [showErrorPanel, setShowErrorPanel] = useState(false);
    const [searchItemsPayload, setSearchItemsPayload] = useState<SearchItemsParams | null>(null);

    // Loaders
    const [showModalLoader, setShowModalLoader] = useState(false);

    // usePluginApi hook
    const {getApiState, makeApiRequest, pluginState} = usePluginApi();

    // Errors
    const [apiError, setApiError] = useState<APIError | null>(null);

    const dispatch = useDispatch();

    // Reset the field states
    const resetFieldStates = useCallback(() => {
        setOptions([]);
        setSuggestions([]);
        setAutoSuggestValue('');
        setApiError(null);
        setSuggestionChosen(false);
        setRequest(null);
        setShowErrorPanel(false);
        setSearchItemsPayload(null);
    }, []);

    const hideModal = useCallback(() => {
        dispatch(resetGlobalModalState());
        resetFieldStates();
    }, []);

    const mapRequestsToSuggestions = (requests: RequestData[]): Array<Record<string, string>> => requests.map((r) => ({
        id: r.sys_id,
        name: r.name,
        short_description: r.short_description,
        price: r.price,
        title: r.category.title,
        category_id: r.category.sys_id,
    }));

    // Set the suggestions when the input value of the auto-suggest changes;
    useEffect(() => {
        setSuggestions(mapRequestsToSuggestions(options));
    }, [options]);

    useEffect(() => {
        // When the request value is reset, reset the caller auto-suggest input as well;
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

    const getItemsSuggestions = () => {
        const {isLoading, isSuccess, isError, data, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.searchItems.apiServiceName, searchItemsPayload);
        return {isLoading, isSuccess, isError, data: data as RequestData[], error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    // Get the suggestions from the API
    const getSuggestions = ({searchFor}: {searchFor?: string}) => {
        setApiError(null);
        setRequest(null);
        setSearchItemsPayload({search: searchFor || ''});
        makeApiRequest(Constants.pluginApiServiceConfigs.searchItems.apiServiceName, {search: searchFor || ''});
    };

    const debouncedGetSuggestions = useCallback(Utils.debounce(getSuggestions, 500), [getSuggestions]);

    // handle input value change
    const handleInputChange = (currentValue: string) => {
        setAutoSuggestValue(currentValue);
        setSuggestionChosen(false);
        if (currentValue) {
            if (currentValue.length >= Constants.CharThresholdToSuggestRequest) {
                debouncedGetSuggestions({searchFor: currentValue});
            }
        }
    };

    // Handle API state updates in the suggestions
    useEffect(() => {
        const {isLoading, isSuccess, isError, data, error} = getItemsSuggestions();
        setShowModalLoader(isLoading);
        if (isError && error) {
            if (error.id === Constants.ApiErrorIdNotConnected || error.id === Constants.ApiErrorIdRefreshTokenExpired) {
                dispatch(setConnected(false));
            }

            setShowErrorPanel(true);
            setApiError(error);
        }

        if (isSuccess && data) {
            setOptions(data);
        }
    }, [getItemsSuggestions().isLoading, getItemsSuggestions().isError, getItemsSuggestions().isSuccess]);

    const serviceNowBaseURL = getConfigState().data?.ServiceNowBaseURL;
    return (
        <Modal
            show={isCreateRequestModalOpen(pluginState)}
            onHide={hideModal}
            className='rhs-modal'
        >
            <>
                <ModalHeader
                    title='Create a request'
                    onHide={hideModal}
                    showCloseIconInHeader={true}
                />
                {(showErrorPanel && apiError) ? (
                    <ResultPanel
                        header={Utils.getResultPanelHeader(apiError, hideModal)}
                        className='wizard__secondary-panel--slide-in result-panel'
                        primaryBtn={{
                            text: 'Close',
                            onClick: hideModal,
                        }}
                        iconClass='fa-times-circle-o result-panel-icon--error'
                    />
                ) : (
                    <>
                        <div
                            className={`padding-h-12 padding-top-25 padding-bottom-30
                            ${suggestionChosen ? 'height-auto' : 'height-120'}`}
                        >
                            <AutoSuggest
                                placeholder='Search catalog items'
                                inputValue={autoSuggestValue}
                                onInputValueChange={handleInputChange}
                                onChangeSelectedSuggestion={handleRequestSelection}
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
                                                <span className='search-panel__description-text channel-text wt-500 text-ellipsis white-space-inherit'>{showModalLoader ? <SkeletonLoader/> : request[header.key] || 'N/A'}</span>
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
                )}
            </>
        </Modal>
    );
};

export default CreateRequest;
