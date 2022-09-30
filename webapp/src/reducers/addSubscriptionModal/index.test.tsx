import reducer, {showModal, hideModal, SubscriptionModalState} from 'reducers/addSubscriptionModal';

test('should change the state of open to "true"', () => {
    const previousState: SubscriptionModalState = {
        open: false,
    };
    expect(reducer(previousState, showModal())).toEqual(
        {open: true},
    );
});

test('should change the state of open to "false"', () => {
    const previousState: SubscriptionModalState = {
        open: true,
    };
    expect(reducer(previousState, hideModal())).toEqual(
        {open: false},
    );
});
