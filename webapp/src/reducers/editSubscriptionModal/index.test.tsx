import {RecordType, SubscriptionType} from 'plugin_constants';
import reducer, {showModal, hideModal, SubscriptionModalState} from 'reducers/editSubscriptionModal';

test('should change the state of open to "true" and data value to "payload"', () => {
    const previousState: SubscriptionModalState = {
        open: false,
    };
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
    const previousState: SubscriptionModalState = {
        open: true,
    };
    expect(reducer(previousState, hideModal())).toEqual(
        {open: false},
    );
});
