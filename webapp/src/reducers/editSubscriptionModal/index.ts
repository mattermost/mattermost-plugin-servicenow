import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type SubscriptionModalState = {
    open: boolean;
    data?: EditSubscriptionData;
}

const initialState: SubscriptionModalState = {
    open: false,
};

export const openEditSubscriptionModalSlice = createSlice({
    name: 'openEditSubscriptionModal',
    initialState,
    reducers: {
        showModal: (state, action: PayloadAction<EditSubscriptionData>) => {
            state.open = true;
            state.data = action.payload;
        },
        hideModal: (state) => {
            state.open = false;
        },
    },
});

export const {showModal, hideModal} = openEditSubscriptionModalSlice.actions;

export default openEditSubscriptionModalSlice.reducer;
