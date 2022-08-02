import React from 'react';

import './styles.scss';

type SkeletonLoaderProps = {
    height?: number;
    width?: number;
}

const SkeletonLoader = ({height, width}: SkeletonLoaderProps) => {
    const styles = {height, width};
    return (
        <div
            className='skeleton-loader'
            style={styles}
        />
    );
};

export default SkeletonLoader;
