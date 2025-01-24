// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import reducer, {refetch, resetRefetch} from 'src/reducers/refetchState';

const previousState: RefetchState = {
    refetch: false,
};

test('should change the state of refetch to "true"', () => {
    expect(reducer(previousState, refetch())).toEqual(
        {refetch: true},
    );
});

test('should change the state of refetch to "false"', () => {
    previousState.refetch = true;
    expect(reducer(previousState, resetRefetch())).toEqual(
        {refetch: false},
    );
});
