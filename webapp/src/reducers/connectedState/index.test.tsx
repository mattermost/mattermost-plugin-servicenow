import reducer, {setConnected, ConnectedState} from 'reducers/connectedState';

test('should change the state of connected to true when payload value is "true"', () => {
    const previousState: ConnectedState = {
        connected: false,
    };
    expect(reducer(previousState, setConnected(true))).toEqual(
        {connected: true},
    );
});

test('should change the state of connected to false when payload value is "false"', () => {
    const previousState: ConnectedState = {
        connected: true,
    };
    expect(reducer(previousState, setConnected(false))).toEqual(
        {connected: false},
    );
});
