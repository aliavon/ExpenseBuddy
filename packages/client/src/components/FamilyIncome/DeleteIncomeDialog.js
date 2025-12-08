import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, SIZE } from 'baseui/modal';
import { ParagraphSmall } from 'baseui/typography';
import { useMutation } from '@apollo/client';
import { toaster } from 'baseui/toast';
import { DELETE_FAMILY_INCOME_MUTATION } from '../../gql/income';

const DeleteIncomeDialog = ({ income, isOpen, onClose, refetch }) => {
  const [deleteIncome, { loading }] = useMutation(DELETE_FAMILY_INCOME_MUTATION, {
    onCompleted: () => {
      toaster.positive('Income deleted successfully', {});
      refetch();
      onClose();
    },
    onError: err => {
      toaster.negative(`Failed to delete income: ${err.message}`, {});
    },
  });

  const handleDelete = () => {
    deleteIncome({
      variables: {
        ids: [income.id],
      },
    });
  };

  if (!income) {
    return null;
  }

  return (
    <Modal
      onClose={onClose} isOpen={isOpen}
      size={SIZE.default} closeable
      animate>
      <ModalHeader>Delete Income?</ModalHeader>
      <ModalBody>
        <ParagraphSmall>
          Are you sure you want to delete this income record?
          <br />
          <br />
          <strong>
            {income.amount}
            {' '}
            {income.currency?.symbol || ''}
            {' '}
          </strong>
          on
          {' '}
          {new Date(income.date).toLocaleDateString()}
          <br />
          <br />
          This action cannot be undone.
        </ParagraphSmall>
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind="tertiary" onClick={onClose}
          disabled={loading}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleDelete} isLoading={loading}>
          Delete
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteIncomeDialog;

