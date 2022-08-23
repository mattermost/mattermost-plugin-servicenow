import {createSlice} from '@reduxjs/toolkit';

type SubscriptionModalState = {
    open: boolean;
}

const initialState: SubscriptionModalState = {
    open: false,
};

export const openEditSubscriptionModalSlice = createSlice({
    name: 'openEditSubscriptionModal',
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

export const {showModal, hideModal} = openEditSubscriptionModalSlice.actions;

export default openEditSubscriptionModalSlice.reducer;
