import {ModalIds, RecordType} from 'src/plugin_constants';
import reducer, {setGlobalModalState, resetGlobalModalState} from 'src/reducers/globalModal';

const previousState: GlobalModalState = {
    modalId: null,
    data: null,
};

test('setGlobalModalState: should change the value of modalId and data equal to payload value', () => {
    const data: CommentAndStateModalData = {
        recordId: 'mockRecordId',
        recordType: RecordType.INCIDENT,
    };

    expect(reducer(previousState, setGlobalModalState({modalId: ModalIds.UPDATE_STATE, data}))).toEqual(
        {modalId: ModalIds.UPDATE_STATE, data},
    );
});

test('resetGlobalModalState: should change the value of modalId and data to "null"', () => {
    expect(reducer(previousState, resetGlobalModalState)).toEqual(
        {modalId: null, data: null},
    );
});
