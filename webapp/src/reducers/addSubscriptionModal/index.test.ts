import reducer, {showModal, hideModal, SubscriptionModalState} from 'src/reducers/addSubscriptionModal';

const previousState: SubscriptionModalState = {
    open: false,
};

test('should change the state of open to "true"', () => {
    expect(reducer(previousState, showModal())).toEqual(
        {open: true},
    );
});

test('should change the state of open to "false"', () => {
    previousState.open = true;
    expect(reducer(previousState, hideModal())).toEqual(
        {open: false},
    );
});
