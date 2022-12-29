import React from 'react';
import {useDispatch} from 'react-redux';

import {Post} from 'mattermost-redux/types/posts';

import {RecordTypesSupportingComments, RecordTypesSupportingStateUpdation, TypesContainingLink} from 'src/plugin_constants';
import {setGlobalModalState} from 'src/reducers/globalModal';
import Utils from 'src/utils';

import './styles.scss';

type ShareRecordPostProps = {
    post: Post,
}

const ShareRecordPost = ({post}: ShareRecordPostProps) => {
    const dispatch = useDispatch();
    const {attachments, record_id, record_type} = post.props;
    const {fields, pretext, title} = attachments[0] as RecordAttachments;
    const data: CommentAndStateModalData = {
        recordId: record_id,
        recordType: record_type,
    };

    const {formatText, messageHtmlToComponent} = window.PostUtils;
    const postTitleText = formatText(title);
    const postTitle = messageHtmlToComponent(postTitleText, false);
    const atMentionText = formatText(pretext, {atMentions: true});
    const atMention = messageHtmlToComponent(atMentionText, false, {mentionHighlight: true});
    return (
        <div className='servicenow-post'>
            {atMention}
            <div className='shared-post'>
                <span className='shared-post__title'>{postTitle}</span>
                {(
                    fields.map((field) => (
                        <div key={field.title}>
                            <div className='shared-post__field-title'>{field.title}</div>
                            <div className='shared-post__field-value'>{Utils.getRecordValueForHeader(field.title as TypesContainingLink, field.value)}</div>
                        </div>
                    ))
                )}
                <div>
                    {RecordTypesSupportingComments.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: 'addOrViewComments', data}))}
                            className='shared-post__modal-button'
                        >
                            {'Add and view comments'}
                        </button>
                    )}
                    {RecordTypesSupportingStateUpdation.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: 'updateState', data}))}
                            className='shared-post__modal-button'
                        >
                            {'Update State'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareRecordPost;
