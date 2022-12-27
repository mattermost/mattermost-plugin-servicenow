export const getGlobalModalState = (state: PluginState): GlobalModalState => state.globalModalReducer;

export const getCurrentModalState = (state: PluginState): GlobalModalState => state.currentModalReducer;

export const isAddSubscriptionModalOpen = (state: PluginState): boolean => state.currentModalReducer.modalId === 'addSubscription';

export const isEditSubscriptionModalOpen = (state: PluginState): boolean => state.currentModalReducer.modalId === 'editSubscription';

export const isShareRecordModalOpen = (state: PluginState): boolean => state.currentModalReducer.modalId === 'shareRecord';

export const isCommentModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'addOrViewComments';

export const isUpdateStateModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'updateState';

export const isCreateIncidentModalOpen = (state: PluginState): boolean => state.currentModalReducer.modalId === 'createIncident';

export const isCreateRequestModalOpen = (state: PluginState): boolean => state.currentModalReducer.modalId === 'createRequest';
