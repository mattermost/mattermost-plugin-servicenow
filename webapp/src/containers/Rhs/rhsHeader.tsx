import React, {useCallback, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';

import {Dropdown, Button, SvgWrapper, ToggleSwitch, MenuButtons} from '@brightscout/mattermost-ui-library';

import useOutsideClick from 'src/hooks/useClickOutside';

import Constants, {ModalIds} from 'src/plugin_constants';
import SVGIcons from 'src/plugin_constants/icons';
import IconButton from 'src/components/Buttons/iconButton';
import {setGlobalModalState} from 'src/reducers/globalModal';

type HeaderProps = {
    showFilterIcon: boolean;
    showAllSubscriptions: boolean;
    setShowAllSubscriptions: (active: boolean) => void;
    filter: SubscriptionFilters;
    setFilter: (filter: SubscriptionFilters) => void;
    setResetFilter: (resetFilter: boolean) => void;
}

const Header = ({
    showFilterIcon,
    showAllSubscriptions,
    setShowAllSubscriptions,
    filter,
    setFilter,
    setResetFilter,
}: HeaderProps) => {
    const [showFilter, setShowFilter] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const dispatch = useDispatch();

    const isFilterApplied = useCallback(() => showAllSubscriptions || filter.createdBy !== Constants.DefaultSubscriptionFilters.createdBy, [filter, showAllSubscriptions]);

    // Detects and closes the filter popover whenever it is opened and the user clicks outside of it
    const wrapperRef = useRef(null);
    useOutsideClick(wrapperRef, () => {
        setShowFilter(false);
        setShowMenu(false);
    });

    return (
        <>
            <div className='position-relative rhs-header-divider'>
                <div className='d-flex align-item-center'>
                    <p className='rhs-title'>{'Subscriptions'}</p>
                    {showFilterIcon && (
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
                    )}
                    <IconButton
                        tooltipText='Actions'
                        onClick={() => setShowMenu(!showMenu)}
                        extraClass={showFilterIcon ? '' : 'margin-left-auto'}
                    >
                        <SvgWrapper
                            width={16}
                            height={28}
                            viewBox='0 -1 11 10'
                            className='padding-left-6'
                        >
                            {SVGIcons.menu}
                        </SvgWrapper>
                    </IconButton>
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
                                text='Close'
                                onClick={() => setShowFilter(false)}
                            />
                        </div>
                    </div>
                )
            }
            {
                showMenu && (
                    <div
                        ref={wrapperRef}
                        className='rhs-filter-popover rhs-menu-popover'
                    >
                        {/* TODO: icons may change later */}
                        <MenuButtons
                            buttons={[
                                {
                                    icon: (
                                        <SvgWrapper
                                            width={16}
                                            height={16}
                                            viewBox='0 0 17 12'
                                        >

                                            {SVGIcons.catalog}
                                        </SvgWrapper>
                                    ),
                                    onClick: (() => dispatch(setGlobalModalState({modalId: ModalIds.CREATE_REQUEST}))),
                                    text: 'Begin catalog request',
                                },
                                {
                                    icon: (
                                        <SvgWrapper
                                            width={16}
                                            height={16}
                                            viewBox='0 0 17 17'
                                        >
                                            {SVGIcons.incident}
                                        </SvgWrapper>
                                    ),
                                    onClick: (() => dispatch(setGlobalModalState({modalId: ModalIds.CREATE_INCIDENT}))),
                                    text: 'Create an incident',
                                },
                                {
                                    icon: (
                                        <SvgWrapper
                                            width={14}
                                            height={14}
                                            viewBox='0 2 16 10'
                                        >
                                            {SVGIcons.share}
                                        </SvgWrapper>
                                    ),
                                    onClick: (() => dispatch(setGlobalModalState({modalId: ModalIds.SHARE_RECORD}))),
                                    text: 'Share a record',
                                },
                            ]}
                        />
                    </div>
                )
            }
        </>
    );
};

export default Header;
