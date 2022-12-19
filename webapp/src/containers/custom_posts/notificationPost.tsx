import React from 'react';
import {useDispatch} from 'react-redux';

import {Post} from 'mattermost-redux/types/posts';

import {setGlobalModalState} from 'src/reducers/globalModal';

import './styles.scss';

const NotificationPost = (props: {post: Post}) => {
    const dispatch = useDispatch();
    const {title_link, title, short_description, attachments, record_id, record_type} = props.post.props;
    const {fields, pretext} = attachments[0] as RecordAttachments;
    const data: CommentAndStateModalData = {
        recordId: record_id,
        recordType: record_type,
    };

    const getNotificationBody = (): JSX.Element => {
        const fieldTables = [] as JSX.Element[];
        let headerCols = [] as JSX.Element[];
        let bodyCols = [] as JSX.Element[];
        let rowPos = 0;
        let nrTables = 0;

        fields.forEach((field) => {
            if (rowPos === 2) {
                fieldTables.push(
                    <table
                        key={nrTables}
                        className='notification-posts__table'
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
                nrTables += 1;
            }

            headerCols.push(
                <th
                    key={field.title}
                    className='shared-posts__field-title'
                >
                    <span>
                        {field.title}
                    </span>
                </th>,
            );

            bodyCols.push(
                <td
                    key={field.title}
                    className='shared-posts__field-value'
                >
                    <span>
                        {field.value}
                    </span>
                </td>,
            );

            rowPos += 1;
        });

        if (headerCols.length > 0) {
            fieldTables.push(
                <table
                    key={nrTables}
                    className='notification-posts__table'
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
        <div className='servicenow-posts'>
            <span className='shared-posts__pretext'>{pretext}</span>
            <div className='shared-posts'>
                <a
                    target='_blank'
                    rel='noreferrer'
                    href={`${title_link}`}
                >
                    <span className='shared-posts__title'>{title}</span>
                </a>
                <span className='shared-posts__title'>{`: ${short_description}`}</span>
                {getNotificationBody()}
                <div>
                    <button
                        onClick={() => dispatch(setGlobalModalState({modalId: 'addOrViewComments', data}))}
                        className='shared-posts__modal-button'
                    >
                        {'Add and view comments'}
                    </button>
                    <button
                        onClick={() => dispatch(setGlobalModalState({modalId: 'updateState', data}))}
                        className='shared-posts__modal-button'
                    >
                        {'Update State'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPost;
