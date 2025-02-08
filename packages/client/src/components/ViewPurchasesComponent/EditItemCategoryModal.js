import React, {useState, useEffect} from 'react';
import {Modal, ModalHeader, ModalBody, ModalFooter, ModalButton} from 'baseui/modal';
import {useMutation} from '@apollo/client';
import {toaster} from 'baseui/toast';

import {EDIT_ITEM_CATEGORY_MUTATION} from '../../gql';
import CategorySelect from '../form/category-select';

const EditItemCategoryModal = ({isOpen, onClose, item}) => {
  const [newCategory, setNewCategory] = useState(item?.category || '');

  useEffect(() => {
    setNewCategory(item?.category || '');
  }, [item]);

  const [editItemCategory, {loading}] = useMutation(EDIT_ITEM_CATEGORY_MUTATION, {
    onCompleted: data => {
      toaster.positive(`Category updated to ${data.editItemCategory.category}`, {autoHideDuration: 3000});
      onClose();
    },
    onError: error => {
      toaster.negative(error.message);
    },
  });

  const handleSave = () => {
    if (!item || !item.name) {
      return;
    }
    editItemCategory({
      variables: {
        name: item.name,
        newCategory,
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalHeader>Edit Category</ModalHeader>
      <ModalBody>
        <div>
          <strong>Item:</strong>
          {' '}
          {item?.name}
        </div>
        <CategorySelect
          placeholder=""
          value={newCategory}
          onChange={value => setNewCategory(value)}
        />
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind="tertiary"
          onClick={onClose}
        >
          Cancel
        </ModalButton>
        <ModalButton
          onClick={handleSave}
          isLoading={loading}
        >
          Save
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default EditItemCategoryModal;
