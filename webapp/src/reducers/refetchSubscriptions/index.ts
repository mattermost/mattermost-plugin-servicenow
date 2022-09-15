import {createSlice} from '@reduxjs/toolkit';

export type RefetchSubscriptionState = {
    refetchSubscriptions: boolean;
};

const initialState: RefetchSubscriptionState = {
    refetchSubscriptions: false,
};

export const refetchSubscriptionsSlice = createSlice({
    name: 'refetchSubscriptions',
    initialState,
    reducers: {
        refetch: (state) => {
            state.refetchSubscriptions = true;
        },
        resetRefetch: (state) => {
            state.refetchSubscriptions = false;
        },
    },
});

export const {refetch, resetRefetch} = refetchSubscriptionsSlice.actions;

export default refetchSubscriptionsSlice.reducer;
