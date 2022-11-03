import {createSlice, PayloadAction} from '@reduxjs/toolkit';

type CommentModalState = {
    open: boolean;
    data?: CommentAndStateModalData;
}

const initialState: CommentModalState = {
    open: false,
};

export const openCommentModalSlice = createSlice({
    name: 'openCommentModalSlice',
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

export const {showModal, hideModal} = openCommentModalSlice.actions;

export default openCommentModalSlice.reducer;