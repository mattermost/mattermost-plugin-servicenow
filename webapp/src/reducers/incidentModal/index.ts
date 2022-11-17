import {createSlice} from '@reduxjs/toolkit';

export type IncidentModalState = {
    open: boolean;
}

const initialState: IncidentModalState = {
    open: false,
};

export const openIncidentModalSlice = createSlice({
    name: 'openIncidentModalSlice',
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

export const {showModal, hideModal} = openIncidentModalSlice.actions;

export default openIncidentModalSlice.reducer;
