import React from 'react';
import {useDispatch} from 'react-redux';

import {Post} from 'mattermost-redux/types/posts';

import {setGlobalModalState} from 'src/reducers/globalModal';

import './styles.scss';
import {ModalId, RecordTypesSupportingComments, RecordTypesSupportingStateUpdation} from 'src/plugin_constants';

type NotificationPostProps = {
    post: Post,
}

const NotificationPost = ({post}: NotificationPostProps) => {
    const dispatch = useDispatch();
    const {attachments, record_id, record_type} = post.props;
    const {fields, title} = attachments[0] as RecordAttachments;
    const data: CommentAndStateModalData = {
        recordId: record_id,
        recordType: record_type,
    };

    const {formatText, messageHtmlToComponent} = window.PostUtils;
    const postTitleText = formatText(title);
    const postTitle = messageHtmlToComponent(postTitleText, false);
    const getNotificationBody = (): JSX.Element => {
        const fieldTables = [] as JSX.Element[];
        let headerCols = [] as JSX.Element[];
        let bodyCols = [] as JSX.Element[];
        let rowPos = 0;
        let tableNumber = 0;

        fields.forEach((field) => {
            if (rowPos === 2) {
                fieldTables.push(
                    <table
                        key={tableNumber}
                        className='notification-post__table'
                    >
                        <thead>
                            <tr>
                                {headerCols}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {bodyCols}
                            </tr>
                        </tbody>
                    </table>,
                );
                headerCols = [];
                bodyCols = [];
                rowPos = 0;
                tableNumber++;
            }

            headerCols.push(
                <th
                    key={field.title}
                    className='shared-post__field-title wt-600'
                >
                    <span>
                        {field.title}
                    </span>
                </th>,
            );

            bodyCols.push(
                <td
                    key={field.title}
                    className='shared-post__field-value'
                >
                    <span>
                        {field.value}
                    </span>
                </td>,
            );

            rowPos++;
        });

        if (headerCols.length) {
            fieldTables.push(
                <table
                    key={tableNumber}
                    className='notification-post__table'
                >
                    <thead>
                        <tr>
                            {headerCols}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {bodyCols}
                        </tr>
                    </tbody>
                </table>,
            );
        }

        return (
            <div>
                {fieldTables}
            </div>
        );
    };

    return (
        <div className='servicenow-post'>
            <div className='shared-post'>
                <div className='wt-600'>{postTitle}</div>
                {getNotificationBody()}
                <div>
                    {RecordTypesSupportingComments.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: ModalId.ADD_OR_VIEW_COMMENTS, data}))}
                            className='shared-post__modal-button wt-700'
                        >
                            {'Add and view comments'}
                        </button>
                    )}
                    {RecordTypesSupportingStateUpdation.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: ModalId.UPDATE_STATE, data}))}
                            className='shared-post__modal-button wt-700'
                        >
                            {'Update State'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPost;
