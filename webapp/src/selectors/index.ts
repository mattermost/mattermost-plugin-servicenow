export const getGlobalModalState = (state: PluginState): GlobalModalState => {
    return state.globalModalReducer;
};

export const isAddSubscriptionModalOpen = (state: PluginState): boolean => {
    return state.globalModalReducer.modalId === 'addSubscription';
};

export const isEditSubscriptionModalOpen = (state: PluginState): boolean => {
    return state.globalModalReducer.modalId === 'editSubscription';
};

export const isShareRecordModalOpen = (state: PluginState): boolean => {
    return state.globalModalReducer.modalId === 'shareRecord';
};

export const isCommentModalOpen = (state: PluginState): boolean => {
    return state.globalModalReducer.modalId === 'addOrViewComments';
};

export const isUpdateStateModalOpen = (state: PluginState): boolean => {
    return state.globalModalReducer.modalId === 'updateState';
};
