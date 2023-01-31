import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {FetchBaseQueryError} from '@reduxjs/toolkit/dist/query';

import {AutoSuggest, ModalFooter} from '@brightscout/mattermost-ui-library';

import useApiRequestCompletionState from 'src/hooks/useApiRequestCompletionState';
import usePluginApi from 'src/hooks/usePluginApi';
import Constants, {RecordDataConfigKeys, SupportedFilters} from 'src/plugin_constants';

import Utils from 'src/utils';

import './styles.scss';

type FiltersPanelProps = {
    className?: string;
    onContinue?: () => void;
    onBack?: () => void;
    filters: FiltersData[];
    setFilters: (filters: FiltersData[]) => void;
    resetStates: boolean;
    setResetStates: (reset: boolean) => void;
    editing: boolean;
    setEditing: (editing: boolean) => void;
}

const FiltersPanel = forwardRef<HTMLDivElement, FiltersPanelProps>(({
    className,
    onBack,
    onContinue,
    filters,
    setFilters,
    resetStates,
    setResetStates,
    editing,
    setEditing,
}: FiltersPanelProps, filtersPanelRef) => {
    const [assignmentGroupOptions, setAssignmentGroupOptions] = useState<FilterFieldsData[]>([]);
    const [serviceOptions, setServiceOptions] = useState<FilterFieldsData[]>([]);
    const [assignmentGroupSuggestions, setAssignmentGroupSuggestions] = useState<Record<string, string>[]>([]);
    const [serviceSuggestions, setServiceSuggestions] = useState<Record<string, string>[]>([]);
    const [assignmentGroupAutoSuggestValue, setAssignmentGroupAutoSuggestValue] = useState('');
    const [serviceAutoSuggestValue, setServiceAutoSuggestValue] = useState('');
    const [searchItemsPayload, setSearchItemsPayload] = useState<SearchFilterItemsParams | null>(null);
    const [defaultAssignmentGroup, setDefaultAssignmentGroup] = useState<Record<string, string>>();
    const [defaultService, setDefaultService] = useState<Record<string, string>>();

    const {makeApiRequestWithCompletionStatus, getApiState} = usePluginApi();

    // Reset the field states
    const resetFieldStates = useCallback(() => {
        setFilters([]);
        setAssignmentGroupOptions([]);
        setServiceOptions([]);
        setAssignmentGroupSuggestions([]);
        setServiceSuggestions([]);
        setAssignmentGroupAutoSuggestValue('');
        setServiceAutoSuggestValue('');
        setSearchItemsPayload(null);
        setEditing(false);
    }, []);

    const getSuggestions = ({searchFor, type}: {searchFor?: string, type?: string}) => {
        if (searchFor) {
            const payload: SearchFilterItemsParams = {
                search: searchFor,
                filter: type === SupportedFilters.ASSIGNMENT_GROUP ? SupportedFilters.ASSIGNMENT_GROUP : SupportedFilters.SERVICE,
            };

            setSearchItemsPayload(payload);
            makeApiRequestWithCompletionStatus(Constants.pluginApiServiceConfigs.getFilterData.apiServiceName, payload);
        }
    };

    const mapDataToSuggestions = (data: FilterFieldsData[]): Array<Record<string, string>> => data.map((d) => ({
        id: d.sys_id,
        name: d.name,
    }));

    const debouncedGetSuggestions = useCallback(Utils.debounce(getSuggestions, Constants.DebounceFunctionTimeLimit), [getSuggestions]);

    const setFiltersValue = (newFilter: FiltersData) => {
        const currentFilters = [...filters];
        const filterIndex = currentFilters.findIndex((filter) => filter.filterType === newFilter.filterType);
        if (currentFilters[filterIndex]) {
            currentFilters[filterIndex] = newFilter;
        } else {
            currentFilters.push(newFilter);
        }

        setFilters(currentFilters);
    };

    const handleAssignmentGroupInputChange = (currentValue: string) => {
        setAssignmentGroupAutoSuggestValue(currentValue);
        setFiltersValue({
            filterType: SupportedFilters.ASSIGNMENT_GROUP,
            filterName: null,
            filterValue: null,
        });

        setEditing(false);
        if (currentValue.length >= Constants.DefaultCharThresholdToShowSuggestions) {
            debouncedGetSuggestions({searchFor: currentValue, type: SupportedFilters.ASSIGNMENT_GROUP});
        }
    };

    const handleServiceInputChange = (currentValue: string) => {
        setServiceAutoSuggestValue(currentValue);
        setFiltersValue({
            filterType: SupportedFilters.SERVICE,
            filterName: null,
            filterValue: null,
        });

        setEditing(false);
        if (currentValue.length >= Constants.DefaultCharThresholdToShowSuggestions) {
            debouncedGetSuggestions({searchFor: currentValue, type: SupportedFilters.SERVICE});
        }
    };

    const handleFilterSelection = (suggestion: Record<string, string> | null) => {
        if (suggestion) {
            const newFilter: FiltersData = {
                filterValue: suggestion.id,
                filterName: suggestion.name,
                filterType: SupportedFilters.SERVICE,
            };

            if (searchItemsPayload?.filter === SupportedFilters.ASSIGNMENT_GROUP) {
                setAssignmentGroupAutoSuggestValue(suggestion.name);
                newFilter.filterType = SupportedFilters.ASSIGNMENT_GROUP;
            } else {
                setServiceAutoSuggestValue(suggestion.name);
            }

            setFiltersValue(newFilter);
        }
    };

    const getItemsSuggestions = () => {
        const {isLoading, data, isError, error: apiErr} = getApiState(Constants.pluginApiServiceConfigs.getFilterData.apiServiceName, searchItemsPayload);
        return {isLoading, data: data as FilterFieldsData[], isError, error: (apiErr as FetchBaseQueryError)?.data as APIError | undefined};
    };

    useApiRequestCompletionState({
        serviceName: Constants.pluginApiServiceConfigs.getFilterData.apiServiceName,
        payload: searchItemsPayload,
        handleSuccess: () => (searchItemsPayload?.filter === SupportedFilters.ASSIGNMENT_GROUP ?
            setAssignmentGroupOptions(data) :
            setServiceOptions(data)),
    });

    useEffect(() => {
        if (assignmentGroupOptions) {
            setAssignmentGroupSuggestions(mapDataToSuggestions(assignmentGroupOptions));
        }

        if (serviceOptions) {
            setServiceSuggestions(mapDataToSuggestions(serviceOptions));
        }
    }, [assignmentGroupOptions, serviceOptions]);

    useEffect(() => {
        if (editing && filters.length) {
            filters.map((filter) => {
                const filterValue: Record<string, string> = {id: filter.filterValue ?? '', name: filter.filterName ?? ''};
                if (filter.filterType === RecordDataConfigKeys.ASSIGNMENT_GROUP) {
                    setDefaultAssignmentGroup(filterValue);
                } else {
                    setDefaultService(filterValue);
                }

                return '';
            });
        }
    }, [editing, filters]);

    // If the "resetStates" is set, reset the data
    useEffect(() => {
        if (resetStates) {
            resetFieldStates();

            // Set the resetState to "false" once we've reset the states
            setResetStates(false);
        }
    }, [resetStates]);

    const {isLoading, data, isError, error} = getItemsSuggestions();
    return (
        <div
            className={className}
            ref={filtersPanelRef}
        >
            <div className='filters-panel filters-panel__auto-suggest'>
                <label className='filters-panel__label font-16 wt-400'>{'Available filters:'}</label>
                <AutoSuggest
                    className='margin-bottom-35'
                    placeholder='Search Assignment Groups'
                    inputValue={assignmentGroupAutoSuggestValue}
                    onInputValueChange={handleAssignmentGroupInputChange}
                    onChangeSelectedSuggestion={handleFilterSelection}
                    loadingSuggestions={(isLoading && searchItemsPayload?.filter === SupportedFilters.ASSIGNMENT_GROUP)}
                    suggestionConfig={{
                        suggestions: assignmentGroupSuggestions,
                        renderValue: (suggestion) => suggestion.name,
                    }}
                    defaultValue={defaultAssignmentGroup}
                    charThresholdToShowSuggestions={Constants.DefaultCharThresholdToShowSuggestions}
                    error={(isError && searchItemsPayload?.filter === SupportedFilters.ASSIGNMENT_GROUP) ? error?.message : ''}
                />
                <AutoSuggest
                    placeholder='Search Services'
                    inputValue={serviceAutoSuggestValue}
                    onInputValueChange={handleServiceInputChange}
                    onChangeSelectedSuggestion={handleFilterSelection}
                    loadingSuggestions={(isLoading && searchItemsPayload?.filter === SupportedFilters.SERVICE)}
                    suggestionConfig={{
                        suggestions: serviceSuggestions,
                        renderValue: (suggestion) => suggestion.name,
                    }}
                    defaultValue={defaultService}
                    charThresholdToShowSuggestions={Constants.DefaultCharThresholdToShowSuggestions}
                    error={(isError && searchItemsPayload?.filter === SupportedFilters.SERVICE) ? error?.message : ''}
                />
            </div>
            <ModalFooter
                onHide={onBack}
                onConfirm={onContinue}
                cancelBtnText='Back'
                confirmBtnText='Continue'
                confirmDisabled={isLoading}
                cancelDisabled={isLoading}
            />
        </div>

    );
});

export default FiltersPanel;
