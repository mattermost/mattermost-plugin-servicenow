import {createSlice} from '@reduxjs/toolkit';

type CommentModalState = {
    open: boolean;
    recordType: string;
    recordId: string;
}

const initialState: CommentModalState = {
    open: false,
    recordType: '',
    recordId: '',
};

export const openCommentModalSlice = createSlice({
    name: 'openCommentModalSlice',
    initialState,
    reducers: {
        showModal: (state) => {
            state.open = true;

            // TODO: remove these values after integrating it with post button.
            state.recordType = 'incident';
            state.recordId = '9d385017c611228701d22104cc95c371';
        },
        hideModal: (state) => {
            state.open = false;
            state.recordType = '';
            state.recordId = '';
        },
    },
});

export const {showModal, hideModal} = openCommentModalSlice.actions;

export default openCommentModalSlice.reducer;
