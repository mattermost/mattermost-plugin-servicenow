import React from 'react';
import {FormGroup, Col, Button} from 'react-bootstrap';

import Client from 'client';

// TODO: Use absolute path here
import {DOWNLOAD_UPDATE_SET_LINK} from '../../constants';

type HelpText = {
    key: string | null;
    props: {
        isMarkdown: boolean;
        isTranslated: boolean;
        text: string;
        textDefault?: string;
        textValues?: string;
    }
}

type Props = {
    id: string;
    label: string;
    value: string;
    helpText: HelpText;
}

const DownloadButton = ({label, helpText}: Props) => (
    <FormGroup>
        <Col sm={4}>
            {label}
        </Col>
        <Col sm={8}>
            {/* TODO: Add proper handling for the download logic as the downloaded filename should be the same that we get in the response headers. */}
            <a
                href={`${Client.getPluginBaseURL()}/${DOWNLOAD_UPDATE_SET_LINK}`}
                download={true}
            >
                <Button>
                    {'Download'}
                </Button>
            </a>
            <div className='help-text'>
                <span>
                    {helpText?.props?.text}
                </span>
            </div>
        </Col>
    </FormGroup>
);

export default DownloadButton;
