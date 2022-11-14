import React from 'react';
import {FormGroup, Col, Button} from 'react-bootstrap';

import Utils from 'src/utils';

import {UPLOAD_SET_FILENAME} from 'src/plugin_constants';

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
            <a
                href={Utils.getBaseUrls().publicFilesUrl + UPLOAD_SET_FILENAME}
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
