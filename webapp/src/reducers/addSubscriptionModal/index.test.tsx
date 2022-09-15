import reducer, {showModal, hideModal} from 'reducers/addSubscriptionModal';

type SubscriptionModalState = {
    open: boolean;
}

test('should change state of open to "true"', () => {
    const previousState: SubscriptionModalState = {
        open: false,
    };
    expect(reducer(previousState, showModal())).toEqual(
        {open: true},
    );
});

test('should change state of open to "false"', () => {
    const previousState: SubscriptionModalState = {
        open: true,
    };
    expect(reducer(previousState, hideModal())).toEqual(
        {open: false},
    );
});
