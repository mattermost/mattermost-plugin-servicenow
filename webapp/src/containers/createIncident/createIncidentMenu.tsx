import React, {MouseEvent, useCallback} from 'react';
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
    const {pluginState} = usePluginApi();
    const dispatch = useDispatch();
    const post = useSelector((state: GlobalState) => getPost(state, postId));
    const siteUrl = useSelector(Utils.getSiteUrl);

    // Check if the current post is a system post or not a valid post
    const systemMessage = Boolean(!post || isSystemMessage(post));
    const show = pluginState.connectedReducer.connected && !systemMessage;

    const handleClick = useCallback((e: MouseEvent<HTMLButtonElement> | Event) => {
        e.preventDefault();
        const incidentModalData: IncidentModalData = {
            description: post.message,
            senderId: post.user_id,
        };
        dispatch(setGlobalModalState({modalId: 'createIncident', data: incidentModalData}) as Action);
    }, [postId]);

    if (!show) {
        return null;
    }

    return (
        <div className='servicenow-incident'>
            <li
                className='MenuItem'
                role='menuitem'
            >
                <button
                    className='incident-menu'
                    role='presentation'
                    onClick={handleClick}
                >
                    <img
                        src={`${Utils.getBaseUrls(siteUrl).publicFilesUrl}${Constants.SERVICENOW_ICON_URL}`}
                        alt='ServiceNow icon'
                        className='incident-menu-icon'
                    />
                    {'Create an Incident'}
                </button>
            </li>
        </div>
    );
};

export default CreateIncidentPostMenuAction;
