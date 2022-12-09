import {ModalId} from 'src/plugin_constants';

export const getGlobalModalState = (state: PluginState): GlobalModalState => state.globalModalReducer;

export const isAddSubscriptionModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.ADD_SUBSCRIPTION;

export const isEditSubscriptionModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.EDIT_SUBSCRIPTION;

export const isShareRecordModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.SHARE_RECORD;

export const isCommentModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.ADD_OR_VIEW_COMMENTS;

export const isUpdateStateModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.UPDATE_STATE;

export const isCreateIncidentModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.CREATE_INCIDENT;

export const isCreateRequestModalOpen = (state: PluginState): boolean => state.globalModalReducer.modalId === ModalId.CREATE_REQUEST;

export const getApiRequestCompletionState = (state: PluginState): ApiRequestCompletionState => state.apiRequestCompletionReducer;
