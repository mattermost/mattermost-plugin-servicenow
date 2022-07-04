import React from "react";
import {FormGroup, Col, Button} from "react-bootstrap";
import Client from 'client';
import {DOWNLOAD_UPDATE_SET_LINK} from '../../constants';

interface HelpText {
    key: string | null;
    props: {
        isMarkdown: boolean;
        isTranslated: boolean;
        text: string;
        textDefault?: string;
        textValues?: string;
    }
}

interface Props {
    id: string;
    label: string;
    value: string;
    helpText: HelpText;
}

export default function DownloadButton({label, helpText}: Props) {
    return (
        <FormGroup>
            <Col sm={4}>
                {label}
            </Col>
            <Col sm={8}>
                {/* TODO: Add proper handling for the download logic as the downloaded filename should be the same that we get in the response headers. */}
                <a href={`${Client.getPluginBaseURL()}/${DOWNLOAD_UPDATE_SET_LINK}`} download>
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
}
