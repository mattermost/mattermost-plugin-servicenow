import React from 'react';

import SVGWrapper from 'components/svgWrapper';

import SVGIcons from 'plugin_constants/icons';

import './styles.scss';

type IconProps = {
    className?: string;
}

export const ServiceNowIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={16}
        height={16}
        viewBox='0 0 28 26'
        className={`icon-text-color--fill ${className}`}
    >
        {SVGIcons.servicenow}
    </SVGWrapper>
);

export const BellIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        viewBox='0 0 48 48'
        width={48}
        height={48}
        className={`icon-text-color--fill rhs-state-icon ${className}`}
    >
        {SVGIcons.bell}
    </SVGWrapper>
);

export const UnlinkIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        viewBox='0 0 48 48'
        width={48}
        height={48}
        className={`icon-text-color--fill rhs-state-icon ${className}`}
    >
        {SVGIcons.unlink}
    </SVGWrapper>
);

export const GlobeIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={14}
        height={14}
        viewBox='0 0 14 14'
        className={`icon-text-color--fill ${className}`}
    >
        {SVGIcons.globe}
    </SVGWrapper>
);

export const LockIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={14}
        height={14}
        viewBox='0 0 14 14'
        className={`icon-text-color--fill ${className}`}
    >
        {SVGIcons.lock}
    </SVGWrapper>
);

export const EditIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={16}
        height={16}
        viewBox='0 0 16 16'
        className={`icon-text-color--stroke ${className}`}
    >
        {SVGIcons.edit}
    </SVGWrapper>
);

export const DeleteIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={16}
        height={16}
        viewBox='0 0 16 16'
        className={`icon-text-color--stroke ${className}`}
    >
        {SVGIcons.delete}
    </SVGWrapper>
);

export const CheckIcon = ({className = ''}: IconProps): JSX.Element => (
    <SVGWrapper
        width={38}
        height={38}
        viewBox='0 0 38 38'
        className={className}
    >
        {SVGIcons.check}
    </SVGWrapper>
);
