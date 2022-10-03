import reducer, {refetch, resetRefetch, RefetchSubscriptionState} from 'reducers/refetchSubscriptions';

const previousState: RefetchSubscriptionState = {
    refetchSubscriptions: false,
};

test('should change the state of refetchSubscriptions to "true"', () => {
    expect(reducer(previousState, refetch())).toEqual(
        {refetchSubscriptions: true},
    );
});

test('should change the state of refetchSubscriptions to "false"', () => {
    previousState.refetchSubscriptions = true;
    expect(reducer(previousState, resetRefetch())).toEqual(
        {refetchSubscriptions: false},
    );
});
