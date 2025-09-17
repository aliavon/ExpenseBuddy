import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, ROLE } from 'baseui/modal';
import { Input } from 'baseui/input';
import { Textarea } from 'baseui/textarea';
import { KIND } from 'baseui/button';

const EditFamilyModal = ({
  isOpen,
  onClose,
  familyInfo,
  onFamilyInfoChange,
  onSave,
  loading,
}) => (
  <Modal
    onClose={onClose}
    isOpen={isOpen}
    role={ROLE.dialog}
  >
    <ModalHeader>Edit Family Information</ModalHeader>
    <ModalBody>
      <Block marginBottom="scale600">
        <LabelMedium marginBottom="scale300">Family Name</LabelMedium>
        <Input
          value={familyInfo?.name || ''}
          onChange={e => onFamilyInfoChange('name', e.target.value)}
          placeholder="Enter family name..."
        />
      </Block>
      <Block marginBottom="scale600">
        <LabelMedium marginBottom="scale300">Description</LabelMedium>
        <Textarea
          value={familyInfo?.description || ''}
          onChange={e => onFamilyInfoChange('description', e.target.value)}
          placeholder="Enter family description..."
          rows={3}
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
        isLoading={loading}
        disabled={!familyInfo?.name?.trim()}
      >
        Save Changes
      </ModalButton>
    </ModalFooter>
  </Modal>
);

export default EditFamilyModal;
