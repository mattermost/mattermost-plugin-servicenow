import {createSlice, PayloadAction} from '@reduxjs/toolkit';

const initialState: GlobalModalState = {
    modalId: null,
    data: null,
};

export const currentModalSlice = createSlice({
    name: 'currentModalSlice',
    initialState,
    reducers: {
        setCurrentModalState: (state: GlobalModalState, action: PayloadAction<GlobalModalState>) => {
            state.modalId = action.payload.modalId;
            state.data = action.payload.data;
        },
        resetCurrentModalState: (state: GlobalModalState) => {
            state.modalId = null;
            state.data = null;
        },
    },
});

export const {setCurrentModalState, resetCurrentModalState} = currentModalSlice.actions;

export default currentModalSlice.reducer;
