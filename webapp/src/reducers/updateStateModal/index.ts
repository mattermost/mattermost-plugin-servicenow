import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type UpdateStateModalReduxState = {
    open: boolean;
    data?: CommentAndStateModalData;
}

const initialState: UpdateStateModalReduxState = {
    open: false,
};

export const openUpdateStateModalSlice = createSlice({
    name: 'openUpdateStateModalSlice',
    initialState,
    reducers: {
        showModal: (state, action: PayloadAction<CommentAndStateModalData>) => {
            state.open = true;
            state.data = action.payload;
        },
        hideModal: (state) => {
            state.open = false;
        },
    },
});

export const {showModal, hideModal} = openUpdateStateModalSlice.actions;

export default openUpdateStateModalSlice.reducer;
