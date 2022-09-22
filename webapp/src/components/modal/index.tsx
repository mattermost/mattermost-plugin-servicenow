import React from 'react';
import {Modal as RBModal} from 'react-bootstrap';

import ModalHeader from './subComponents/modalHeader';
import ModalLoader from './subComponents/modalLoader';
import ModalBody from './subComponents/modalBody';
import ModalFooter from './subComponents/modalFooter';
import ModalSubTitleAndError from './subComponents/modalSubtitleAndError';

type ModalProps = {
    show: boolean;
    onHide: () => void;
    showCloseIconInHeader?: boolean;
    children?: JSX.Element;
    title?: string | JSX.Element;
    subTitle?: string | JSX.Element;
    onConfirm?: () => void;
    confirmBtnText?: string;
    cancelBtnText?: string;
    className?: string;
    loading?: boolean;
    error?: string | JSX.Element;
    confirmDisabled?: boolean;
    cancelDisabled?: boolean;
    confirmBtnClassName?: string;
}

const Modal = ({show, onHide, showCloseIconInHeader = true, children, title, subTitle, onConfirm, confirmBtnText, cancelBtnText = 'Cancel', className = '', loading = false, error, confirmDisabled, cancelDisabled, confirmBtnClassName}: ModalProps) => {
    return (
        <RBModal
            show={show}
            onHide={onHide}
            centered={true}
            className={`modal ${className}`}
        >
            <ModalHeader
                title={title}
                showCloseIconInHeader={showCloseIconInHeader}
                onHide={onHide}
            />
            <ModalLoader loading={loading}/>
            <ModalBody>
                <>
                    <ModalSubTitleAndError
                        subTitle={subTitle}
                    />
                    {children}
                    <ModalSubTitleAndError
                        error={error}
                    />
                </>
            </ModalBody>
            <ModalFooter
                onHide={onHide}
                onConfirm={onConfirm}
                cancelBtnText={cancelBtnText}
                confirmBtnText={confirmBtnText}
                cancelDisabled={cancelDisabled}
                confirmDisabled={confirmDisabled}
                confirmBtnClassName={confirmBtnClassName}
            />
        </RBModal>
    );
};

export default Modal;