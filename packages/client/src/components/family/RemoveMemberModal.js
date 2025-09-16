import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { KIND } from 'baseui/button';

const RemoveMemberModal = ({
  isOpen,
  onClose,
  memberToRemove,
  onConfirm,
  loading,
}) => (
  <Modal
    onClose={onClose}
    isOpen={isOpen}
    role={ROLE.dialog}
  >
    <ModalHeader>Confirm Member Removal</ModalHeader>
    <ModalBody>
      Are you sure you want to remove
      {' '}
      <strong>
        {memberToRemove?.firstName}
        {' '}
        {memberToRemove?.lastName}
      </strong>
      {' '}
      from your family? This action cannot be undone.
    </ModalBody>
    <ModalFooter>
      <ModalButton
        kind={KIND.tertiary}
        onClick={onClose}
      >
        Cancel
      </ModalButton>
      <ModalButton
        onClick={onConfirm}
        isLoading={loading}
      >
        Remove Member
      </ModalButton>
    </ModalFooter>
  </Modal>
);

export default RemoveMemberModal;
