import reducer, {setConnected, ConnectedState} from 'reducers/connectedState';

test('should change state of connected to true on payload value equal to "true"', () => {
    const previousState: ConnectedState = {
        connected: false,
    };
    expect(reducer(previousState, setConnected(true))).toEqual(
        {connected: true},
    );
});

test('should change state of connected to false on payload value equal to "false"', () => {
    const previousState: ConnectedState = {
        connected: true,
    };
    expect(reducer(previousState, setConnected(false))).toEqual(
        {connected: false},
    );
});
