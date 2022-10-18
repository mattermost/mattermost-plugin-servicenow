import {createSlice} from '@reduxjs/toolkit';

export type UpdateStateModalState = {
    open: boolean;
}

const initialState: UpdateStateModalState = {
    open: false,
};

export const openUpdateStateModalSlice = createSlice({
    name: 'openUpdateStateModalSlice',
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

export const {showModal, hideModal} = openUpdateStateModalSlice.actions;

export default openUpdateStateModalSlice.reducer;
