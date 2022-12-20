import React from 'react';
import {useDispatch} from 'react-redux';

import {Post} from 'mattermost-redux/types/posts';

import {RecordType} from 'src/plugin_constants';
import {setGlobalModalState} from 'src/reducers/globalModal';
import Utils from 'src/utils';

import './styles.scss';

const ShareRecordsPost = (props: {post: Post}) => {
    const dispatch = useDispatch();
    const {attachments, record_id, record_type} = props.post.props;
    const {fields, title_link, title} = attachments[0] as RecordAttachments;
    const data: CommentAndStateModalData = {
        recordId: record_id,
        recordType: record_type,
    };

    return (
        <div className='servicenow-posts'>
            <div className='shared-posts'>
                <a
                    target='_blank'
                    rel='noreferrer'
                    href={`${title_link}`}
                >
                    <span className='shared-posts__title'>{title}</span>
                </a>
                {(
                    fields.map((field) => (
                        <div key={field.title}>
                            <div className='shared-posts__field-title'>{field.title}</div>
                            <div className='shared-posts__field-value'>{Utils.getRecordValueForHeader(field.title, field.value)}</div>
                        </div>
                    ))
                )}
                <div>
                    {record_type !== RecordType.KNOWLEDGE && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: 'addOrViewComments', data}))}
                            className='shared-posts__modal-button'
                        >
                            {'Add and view comments'}
                        </button>
                    )}
                    {record_type !== RecordType.CHANGE_REQUEST &&
                    record_type !== RecordType.PROBLEM &&
                    record_type !== RecordType.KNOWLEDGE &&
                    (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: 'updateState', data}))}
                            className='shared-posts__modal-button'
                        >
                            {'Update State'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareRecordsPost;
