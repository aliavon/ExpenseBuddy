import React from 'react';
import { Modal, ModalHeader, ModalBody, SIZE } from 'baseui/modal';
import { useMutation } from '@apollo/client';
import { toaster } from 'baseui/toast';
import { CREATE_FAMILY_INCOME_MUTATION } from '../../gql/income';
import IncomeForm from './IncomeForm';

const AddIncomeModal = ({ isOpen, onClose, refetch }) => {
  const [createIncome, { loading }] = useMutation(CREATE_FAMILY_INCOME_MUTATION, {
    onCompleted: () => {
      toaster.positive('Income added successfully', {});
      refetch();
      onClose();
    },
    onError: err => {
      toaster.negative(`Failed to add income: ${err.message}`, {});
    },
  });

  const handleSubmit = values => {
    createIncome({
      variables: {
        familyIncomes: [values],
      },
    });
  };

  return (
    <Modal
      onClose={onClose} isOpen={isOpen}
      size={SIZE.default} closeable
      autoFocus={false}
      animate>
      <ModalHeader>Add Income</ModalHeader>
      <ModalBody>
        <IncomeForm onSubmit={handleSubmit} loading={loading} />
      </ModalBody>
    </Modal>
  );
};

export default AddIncomeModal;

