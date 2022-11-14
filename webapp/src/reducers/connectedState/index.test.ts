import reducer, {setConnected, ConnectedState} from 'src/reducers/connectedState';

const previousState: ConnectedState = {
    connected: false,
};

test('should change the state of connected to true when payload value is "true"', () => {
    expect(reducer(previousState, setConnected(true))).toEqual(
        {connected: true},
    );
});

test('should change the state of connected to false when payload value is "false"', () => {
    previousState.connected = true;
    expect(reducer(previousState, setConnected(false))).toEqual(
        {connected: false},
    );
});
