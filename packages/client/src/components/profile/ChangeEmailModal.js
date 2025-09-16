import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { Input } from 'baseui/input';
import { KIND } from 'baseui/button';

const ChangeEmailModal = ({
  isOpen,
  onClose,
  user,
  emailData,
  onEmailChange,
  onSave,
  loading = false,
}) => {
  const isValidEmail = emailData.newEmail.includes('@');

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      role={ROLE.dialog}
    >
      <ModalHeader>Change Email Address</ModalHeader>
      <ModalBody>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">Current Email</LabelMedium>
          <ParagraphSmall color="#666" marginBottom="scale400">
            {user?.email}
            {user?.isEmailVerified ? ' ✓ Verified' : ' ⚠️ Not verified'}
          </ParagraphSmall>
        </Block>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">New Email Address</LabelMedium>
          <Input
            type="email"
            value={emailData.newEmail}
            onChange={e => onEmailChange('newEmail', e.target.value)}
            placeholder="Enter new email address..."
          />
        </Block>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">Current Password</LabelMedium>
          <Input
            type="password"
            value={emailData.currentPassword}
            onChange={e => onEmailChange('currentPassword', e.target.value)}
            placeholder="Enter current password to confirm..."
          />
        </Block>
        <ParagraphSmall color="#666" fontSize="12px">
          We will send verification emails to both your current and new email addresses.
        </ParagraphSmall>
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind={KIND.tertiary}
          onClick={onClose}
        >
          Cancel
        </ModalButton>
        <ModalButton
          onClick={onSave}
          disabled={
            loading ||
            !emailData.newEmail.trim() ||
            !emailData.currentPassword.trim() ||
            !isValidEmail
          }
          isLoading={loading}
        >
          {loading ? 'Processing...' : 'Change Email'}
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default ChangeEmailModal;
