import React, {useCallback, useRef} from 'react';
import {useDispatch} from 'react-redux';

import {Dropdown, Button, SvgWrapper} from '@brightscout/mattermost-ui-library';

import useOutsideClick from 'src/hooks/useClickOutside';

import Constants from 'src/plugin_constants';
import SVGIcons from 'src/plugin_constants/icons';
import IconButton from 'src/components/Buttons/iconButton';
import {setGlobalModalState} from 'src/reducers/globalModal';

type HeaderProps = {
    showFilter: boolean;
    setShowFilter: (filter: boolean) => void;
    filter: SubscriptionFilters;
    setFilter: (filter: SubscriptionFilters) => void;
}

const Header = ({
    showFilter,
    setShowFilter,
    filter,
    setFilter,
}: HeaderProps) => {
    const dispatch = useDispatch();

    const isFilterApplied = useCallback(() => filter.createdBy !== Constants.DefaultSubscriptionFilters.createdBy, [filter]);

    // Detects and closes the filter popover whenever it is opened and the user clicks outside of it
    const wrapperRef = useRef(null);
    useOutsideClick(wrapperRef, () => {
        setShowFilter(false);
    });

    return (
        <>
            <div className='position-relative'>
                <div className='d-flex align-item-center'>
                    <p className='rhs-title'>{'Subscriptions'}</p>
                    <IconButton
                        tooltipText='Filter'
                        extraClass={`margin-left-auto flex-basis-initial margin-right-8 ${isFilterApplied() && 'filter-button'}`}
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <SvgWrapper
                            width={18}
                            height={12}
                            viewBox='0 0 18 12'
                        >
                            {SVGIcons.filter}
                        </SvgWrapper>
                    </IconButton>
                    <button
                        className='btn btn-primary share-record-btn'
                        onClick={() => dispatch(setGlobalModalState({modalId: 'shareRecord'}))}
                    >
                        <span>
                            <SvgWrapper
                                width={16}
                                height={16}
                                viewBox='0 0 14 12'
                                className='share-record-icon'
                            >
                                {SVGIcons.share}
                            </SvgWrapper>
                        </span>
                        {Constants.ShareRecordButton}
                    </button>
                </div>
            </div>
            {
                showFilter && (
                    <div
                        ref={wrapperRef}
                        className='rhs-filter-popover'
                    >
                        <div className='margin-bottom-15'>
                            <Dropdown
                                placeholder='Created By'
                                value={filter.createdBy}
                                onChange={(newValue) => {
                                    setFilter({...filter, createdBy: newValue});
                                }}
                                options={Constants.SubscriptionFilterCreatedByOptions}
                                disabled={false}
                            />
                        </div>
                        <div className='text-align-right'>
                            <Button
                                text='Reset'
                                onClick={() => {
                                    setFilter(Constants.DefaultSubscriptionFilters);
                                }}
                                extraClass='margin-right-8'
                                isSecondaryButton={true}
                                isDisabled={!isFilterApplied()}
                            />
                            <Button
                                text='Close'
                                onClick={() => setShowFilter(false)}
                            />
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Header;
