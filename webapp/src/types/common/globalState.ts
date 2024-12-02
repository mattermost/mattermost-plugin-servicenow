import {GlobalState as OriginalGlobalState} from 'mattermost-redux/types/store';

export interface GlobalState extends OriginalGlobalState {
    views?: {
        rhs?: {
            rhsState: string;
            pluggableId: string;
        };
    };
}
