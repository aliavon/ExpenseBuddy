import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { KIND } from 'baseui/button';

const LogoutConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
}) => (
  <Modal
    onClose={onClose}
    isOpen={isOpen}
    role={ROLE.dialog}
  >
    <ModalHeader>Confirm Logout</ModalHeader>
    <ModalBody>
      Are you sure you want to logout? You will need to login again to access your account.
    </ModalBody>
    <ModalFooter>
      <ModalButton
        kind={KIND.tertiary}
        onClick={onClose}
      >
        Cancel
      </ModalButton>
      <ModalButton onClick={onConfirm}>
        Logout
      </ModalButton>
    </ModalFooter>
  </Modal>
);

export default LogoutConfirmModal;
