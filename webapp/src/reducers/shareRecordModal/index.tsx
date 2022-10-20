import {createSlice} from '@reduxjs/toolkit';

export type ShareRecordModalState = {
    open: boolean;
}

const initialState: ShareRecordModalState = {
    open: false,
};

export const openShareRecordModalSlice = createSlice({
    name: 'openShareRecordModalSlice',
    initialState,
    reducers: {
        showModal: (state) => {
            state.open = true;
        },
        hideModal: (state) => {
            state.open = false;
        },
    },
});

export const {showModal, hideModal} = openShareRecordModalSlice.actions;

export default openShareRecordModalSlice.reducer;
