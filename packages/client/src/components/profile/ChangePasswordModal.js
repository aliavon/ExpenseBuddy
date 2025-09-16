import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { Input } from 'baseui/input';
import { KIND } from 'baseui/button';

const ChangePasswordModal = ({
  isOpen,
  onClose,
  passwordData,
  onPasswordChange,
  onSave,
  loading = false,
}) => {
  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;
  const hasValidLength = passwordData.newPassword.length >= 8;

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      role={ROLE.dialog}
    >
      <ModalHeader>Change Password</ModalHeader>
      <ModalBody>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">Current Password</LabelMedium>
          <Input
            type="password"
            value={passwordData.currentPassword}
            onChange={e => onPasswordChange('currentPassword', e.target.value)}
            placeholder="Enter current password..."
          />
        </Block>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">New Password</LabelMedium>
          <Input
            type="password"
            value={passwordData.newPassword}
            onChange={e => onPasswordChange('newPassword', e.target.value)}
            placeholder="Enter new password (min 8 characters)..."
          />
        </Block>
        <Block marginBottom="scale600">
          <LabelMedium marginBottom="scale300">Confirm New Password</LabelMedium>
          <Input
            type="password"
            value={passwordData.confirmPassword}
            onChange={e => onPasswordChange('confirmPassword', e.target.value)}
            placeholder="Confirm new password..."
          />
        </Block>
        {passwordData.newPassword && passwordData.confirmPassword &&
          !passwordsMatch && (
          <ParagraphSmall color="#D44333">
            Passwords do not match
          </ParagraphSmall>
        )}
        {passwordData.newPassword && !hasValidLength && (
          <ParagraphSmall color="#D44333">
            Password must be at least 8 characters long
          </ParagraphSmall>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind={KIND.tertiary}
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </ModalButton>
        <ModalButton
          onClick={onSave}
          disabled={
            loading ||
            !passwordData.currentPassword.trim() ||
            !passwordData.newPassword.trim() ||
            !passwordData.confirmPassword.trim() ||
            !passwordsMatch ||
            !hasValidLength
          }
          isLoading={loading}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default ChangePasswordModal;
