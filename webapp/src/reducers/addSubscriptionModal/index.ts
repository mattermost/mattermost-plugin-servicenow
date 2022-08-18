import {createSlice} from '@reduxjs/toolkit';

type SubscriptionModalState = {
    open: boolean;
}

const initialState: SubscriptionModalState = {
    open: false,
};

export const openAddSubscriptionModalSlice = createSlice({
    name: 'openAddSubscriptionModal',
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

export const {showModal, hideModal} = openAddSubscriptionModalSlice.actions;

export default openAddSubscriptionModalSlice.reducer;
