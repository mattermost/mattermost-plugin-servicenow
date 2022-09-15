import reducer, {refetch, resetRefetch, RefetchSubscriptionState} from 'reducers/refetchSubscriptions';

test('should change state of refetchSubscriptions to "true"', () => {
    const previousState: RefetchSubscriptionState = {
        refetchSubscriptions: false,
    };
    expect(reducer(previousState, refetch())).toEqual(
        {refetchSubscriptions: true},
    );
});

test('should change state of refetchSubscriptions to "false"', () => {
    const previousState: RefetchSubscriptionState = {
        refetchSubscriptions: false,
    };
    expect(reducer(previousState, resetRefetch())).toEqual(
        {refetchSubscriptions: false},
    );
});
