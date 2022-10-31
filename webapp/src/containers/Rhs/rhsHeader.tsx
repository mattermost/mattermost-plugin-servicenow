import React, {useCallback, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';

import {Dropdown, Button, SvgWrapper, ToggleSwitch} from '@brightscout/mattermost-ui-library';

import useOutsideClick from 'hooks/useClickOutside';

import Constants from 'plugin_constants';
import SVGIcons from 'plugin_constants/icons';
import IconButton from 'components/Buttons/iconButton';

import {showModal as showRecordModal} from 'reducers/shareRecordModal';

type HeaderProps = {
    showAllSubscriptions: boolean;
    setShowAllSubscriptions: (active: boolean) => void;
    filter: SubscriptionFilters;
    setFilter: (filter: SubscriptionFilters) => void;
    setResetFilter: (resetFilter: boolean) => void;
}

const Header = ({
    showAllSubscriptions,
    setShowAllSubscriptions,
    filter,
    setFilter,
    setResetFilter,
}: HeaderProps) => {
    const [showFilter, setShowFilter] = useState(false);
    const dispatch = useDispatch();

    const isFilterApplied = useCallback(() => showAllSubscriptions || filter.createdBy !== Constants.DefaultSubscriptionFilters.createdBy, [filter, showAllSubscriptions]);

    // Detects and closes the filter popover whenever it is opened and the user clicks outside of it
    const wrapperRef = useRef(null);
    useOutsideClick(wrapperRef, () => {
        setShowFilter(false);
    });

    return (
        <>
            <div className='position-relative rhs-header-divider'>
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
                        onClick={() => dispatch(showRecordModal())}
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
                        <div className='d-flex align-item-center margin-bottom-15 toggle-class'>
                            <ToggleSwitch
                                active={showAllSubscriptions}
                                onChange={(active) => setShowAllSubscriptions(active)}
                                label={Constants.RhsToggleLabel}
                                labelPositioning='right'
                            />
                        </div>
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
                                    setResetFilter(true);
                                    setFilter(Constants.DefaultSubscriptionFilters);
                                    setShowAllSubscriptions(false);
                                }}
                                extraClass='margin-right-8'
                                isSecondaryButton={true}
                                isDisabled={!isFilterApplied()}
                            />
                            <Button
                                text='Hide'
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