import React from 'react';

import './styles.scss';

type SkeletonLoaderProps = {
    height?: number;
    width?: number;
}

const SkeletonLoader = ({height, width}: SkeletonLoaderProps) => (
    <div
        className='skeleton-loader'
        style={{height, width}}
    />
);

export default SkeletonLoader;
