import React from 'react';
import {shallow, ShallowWrapper} from 'enzyme';

import DownloadButtons from './download_button';

const downloadButtonProps = {
    id: 'mockId',
    label: 'mockLabel',
    value: 'mockValue',
    helpText: {
        key: 'mockKey',
        props: {
            isMarkdown: true,
            isTranslated: true,
            text: 'mockText',
        },
    },
};

describe('Download Button', () => {
    let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

    beforeEach(() => {
        component = shallow(<DownloadButtons {...downloadButtonProps}/>);
    });

    it('Should render correctly', () => {
        expect(component).toMatchSnapshot();
    });

    it('Should render the label correctly', () => {
        expect(component.text().includes(downloadButtonProps.label)).toBeTruthy();
    });

    it('Should render the help text correctly', () => {
        expect(component.text().includes(downloadButtonProps.helpText.props.text)).toBeTruthy();
    });

    it('Should render the download button text correctly', () => {
        expect(component.text().includes('Download')).toBeTruthy();
    });

    it('Should render the download button body correctly', () => {
        expect(component.find('Button')).toHaveLength(1);
        expect(component.find('Col')).toHaveLength(2);
    });
});
