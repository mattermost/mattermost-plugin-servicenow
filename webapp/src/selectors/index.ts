export const getGlobalModalState = (state: PluginState): GlobalModalState => state.globalModalReducer;

export const isAddSubscriptionModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'addSubscription';

export const isEditSubscriptionModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'editSubscription';

export const isShareRecordModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'shareRecord';

export const isCommentModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'addOrViewComments';

export const isUpdateStateModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'updateState';

export const isCreateIncidentModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'createIncident';

export const isCreateRequestModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === 'createRequest';
