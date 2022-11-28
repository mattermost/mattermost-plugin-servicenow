import React, {MouseEvent, useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Action} from 'redux';

import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {isSystemMessage} from 'mattermost-redux/utils/post_utils';

import {GlobalState} from 'mattermost-webapp/types/store';

import Constants from 'src/plugin_constants';

import {setGlobalModalState} from 'src/reducers/globalModal';
import usePluginApi from 'src/hooks/usePluginApi';
import Utils from 'src/utils';

type PropTypes = {
    postId: string;
}

const CreateIncidentPostMenuAction = ({postId}: PropTypes) => {
    const {makeApiRequest, getApiState} = usePluginApi();
    const dispatch = useDispatch();
    const post = useSelector((state: GlobalState) => getPost(state, postId));
    const {data} = getApiState(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);

    // Check if the current post is a system post or not a valid post
    const systemMessage = Boolean(!post || isSystemMessage(post));
    const show = (data as ConnectedState)?.connected && !systemMessage;

    const handleClick = useCallback((e: MouseEvent<HTMLButtonElement> | Event) => {
        e.preventDefault();
        const incidentModalData: IncidentModalData = {
            description: post.message,
            shortDescription: post.message,
        };
        dispatch(setGlobalModalState({modalId: 'createIncident', data: incidentModalData}) as Action);
    }, [postId]);

    // Make request to get connected user
    useEffect(() => {
        makeApiRequest(Constants.pluginApiServiceConfigs.getConnectedUser.apiServiceName);
    }, []);

    if (!show) {
        return null;
    }

    return (
        <li
            className='MenuItem'
            role='menuitem'
        >
            <button
                className='style-none'
                role='presentation'
                onClick={handleClick}
            >
                <img
                    src={`${Utils.getBaseUrls().publicFilesUrl}${Constants.SERVICENOW_ICON_URL}`}
                    className='incident-menu-icon'
                />
                {'Create an Incident'}
            </button>
        </li>
    );
};

export default CreateIncidentPostMenuAction;
