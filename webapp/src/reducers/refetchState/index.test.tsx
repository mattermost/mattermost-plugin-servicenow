import reducer, {refetch, resetRefetch, RefetchState} from 'reducers/refetchState';

const previousState: RefetchState = {
    refetch: false,
};

test('should change the state of refetch to "true"', () => {
    expect(reducer(previousState, refetch())).toEqual(
        {refetchSubscriptions: true},
    );
});

test('should change the state of refetch to "false"', () => {
    previousState.refetch = true;
    expect(reducer(previousState, resetRefetch())).toEqual(
        {refetchSubscriptions: false},
    );
});
