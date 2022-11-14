import {RecordType, SubscriptionType} from 'src/plugin_constants';
import reducer, {showModal, hideModal, SubscriptionModalState} from 'src/reducers/editSubscriptionModal';

const previousState: SubscriptionModalState = {
    open: false,
};

test('should change the state of open to "true" and data value to "payload"', () => {
    const payload: EditSubscriptionData = {
        channel: 'mockChanel',
        id: 'mockId',
        recordId: 'mockRecordId',
        recordType: RecordType.INCIDENT,
        subscriptionEvents: [],
        type: SubscriptionType.RECORD,
    };
    expect(reducer(previousState, showModal(payload))).toEqual(
        {open: true, data: payload},
    );
});

test('should change the state of open to "false"', () => {
    previousState.open = true;
    expect(reducer(previousState, hideModal())).toEqual(
        {open: false},
    );
});
