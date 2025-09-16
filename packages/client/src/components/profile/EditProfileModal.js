import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { Input } from 'baseui/input';
import { KIND } from 'baseui/button';

const EditProfileModal = ({
  isOpen,
  onClose,
  profileData,
  onProfileChange,
  onSave,
  loading = false,
}) => (
  <Modal
    onClose={onClose}
    isOpen={isOpen}
    role={ROLE.dialog}
  >
    <ModalHeader>Edit Personal Information</ModalHeader>
    <ModalBody>
      <Block marginBottom="scale600">
        <LabelMedium marginBottom="scale300">First Name</LabelMedium>
        <Input
          value={profileData.firstName}
          onChange={e => onProfileChange('firstName', e.target.value)}
          placeholder="Enter first name..."
        />
      </Block>
      <Block marginBottom="scale600">
        <LabelMedium marginBottom="scale300">Last Name</LabelMedium>
        <Input
          value={profileData.lastName}
          onChange={e => onProfileChange('lastName', e.target.value)}
          placeholder="Enter last name..."
        />
      </Block>
      <Block marginBottom="scale600">
        <LabelMedium marginBottom="scale300">Middle Name (Optional)</LabelMedium>
        <Input
          value={profileData.middleName}
          onChange={e => onProfileChange('middleName', e.target.value)}
          placeholder="Enter middle name..."
        />
      </Block>
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
        disabled={loading || !profileData.firstName.trim() || !profileData.lastName.trim()}
        isLoading={loading}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </ModalButton>
    </ModalFooter>
  </Modal>
);

export default EditProfileModal;
