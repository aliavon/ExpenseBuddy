import React from 'react';
import { Modal, ModalHeader, ModalBody, SIZE } from 'baseui/modal';
import { useMutation } from '@apollo/client';
import { toaster } from 'baseui/toast';
import { UPDATE_FAMILY_INCOME_MUTATION } from '../../gql/income';
import IncomeForm from './IncomeForm';

const EditIncomeModal = ({ income, isOpen, onClose, refetch }) => {
  const [updateIncome, { loading }] = useMutation(UPDATE_FAMILY_INCOME_MUTATION, {
    onCompleted: () => {
      toaster.positive('Income updated successfully', {});
      refetch();
      onClose();
    },
    onError: err => {
      toaster.negative(`Failed to update income: ${err.message}`, {});
    },
  });

  const handleSubmit = values => {
    updateIncome({
      variables: {
        updates: [
          {
            id: income.id,
            ...values,
          },
        ],
      },
    });
  };

  const initialValues = income
    ? {
      date: new Date(income.date),
      amount: income.amount,
      currencyId: income.currency?.id || '',
      typeId: income.type?.id || '',
      contributorId: income.contributor?.id || '',
      periodicity: income.periodicity,
      note: income.note || '',
    }
    : null;

  if (!income) {
    return null;
  }

  return (
    <Modal
      onClose={onClose} isOpen={isOpen}
      autoFocus={false}
      size={SIZE.default} closeable
      animate>
      <ModalHeader>Edit Income</ModalHeader>
      <ModalBody>
        <IncomeForm
          initialValues={initialValues} onSubmit={handleSubmit}
          loading={loading} />
      </ModalBody>
    </Modal>
  );
};

export default EditIncomeModal;

