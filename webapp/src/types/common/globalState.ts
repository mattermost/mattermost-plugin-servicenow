// Copyright (c) 2022-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GlobalState as OriginalGlobalState} from '@mattermost/types/store';

export interface GlobalState extends OriginalGlobalState {
    views?: {
        rhs?: {
            rhsState: string;
            pluggableId: string;
        };
    };
}
