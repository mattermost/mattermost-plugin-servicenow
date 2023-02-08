import React from 'react';
import {useDispatch} from 'react-redux';

import {Post} from 'mattermost-redux/types/posts';

import {ModalIds, RecordTypesSupportingComments, RecordTypesSupportingStateUpdation, TypesContainingLink} from 'src/plugin_constants';
import {setGlobalModalState} from 'src/reducers/globalModal';
import Utils from 'src/utils';

import './styles.scss';

type ServiceNowPostProps = {
    post: Post,
}

const ServiceNowPost = ({post}: ServiceNowPostProps) => {
    const {type, props} = post;
    const {attachments, record_id, record_type} = props;
    const {fields, pretext, title} = attachments[0] as RecordAttachments;

    const dispatch = useDispatch();
    const data: CommentAndStateModalData = {
        recordId: record_id,
        recordType: record_type,
    };

    const {formatText, messageHtmlToComponent} = window.PostUtils;
    const postTitleText = formatText(title);
    const postTitle = messageHtmlToComponent(postTitleText, false);
    const atMentionText = formatText(pretext, {atMentions: true});
    const atMention = messageHtmlToComponent(atMentionText, false, {mentionHighlight: true});
    const descriptionText = formatText(((fields?.filter((f) => f.title === 'Description') as unknown as RecordFields[])?.[0]?.value) as string);
    const description = messageHtmlToComponent(descriptionText, false);

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
                    {field.title === 'Description' ? (
                        <span>
                            {description}
                        </span>
                    ) : (
                        <span>
                            {(type as string) === 'custom_sn_share' ? Utils.getRecordValueForHeader(field.title as TypesContainingLink, field.value) : (field.value)}
                        </span>
                    )}
                </td>,
            );

            rowPos++;

            if (field.title === 'Description') {
                rowPos++;
            }
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
            <>
                <div>
                    {fieldTables}
                </div>
                <div>
                    {RecordTypesSupportingComments.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: ModalIds.ADD_OR_VIEW_COMMENTS, data}))}
                            className='shared-post__modal-button wt-700'
                        >
                            {'Add and view comments'}
                        </button>
                    )}
                    {RecordTypesSupportingStateUpdation.has(record_type) && (
                        <button
                            onClick={() => dispatch(setGlobalModalState({modalId: ModalIds.UPDATE_STATE, data}))}
                            className='shared-post__modal-button wt-700'
                        >
                            {'Update State'}
                        </button>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className='servicenow-post'>
            {atMention}
            <div className='shared-post'>
                <span className='wt-600'>{postTitle}</span>
                {getNotificationBody()}
            </div>
        </div>
    );
};

export default ServiceNowPost;
