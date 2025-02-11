import React, {useState, useEffect} from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
} from 'baseui/modal';
import {useMutation} from '@apollo/client';
import {toaster} from 'baseui/toast';

import {EDIT_ITEMS_CATEGORY_MUTATION} from '../../gql';
import CategorySelect from '../form/category-select';

const EditItemCategoryModal = ({isOpen, onClose, items, clearSelection}) => {
  const [newCategory, setNewCategory] = useState(() => items && items.length === 1 ? items[0].category : '');

  useEffect(() => {
    if (items && items.length === 1) {
      setNewCategory(items[0].category || '');
    } else {
      setNewCategory('');
    }
  }, [items]);

  const getHandleClose = cancel => () => {
    onClose();
    items.length > 1 && !cancel && clearSelection();
  };

  const [editItemsCategory, {loading}] = useMutation(
    EDIT_ITEMS_CATEGORY_MUTATION,
    {
      onCompleted: data => {
        const updatedCategory =
          data.editItemsCategory && data.editItemsCategory[0]
            ? data.editItemsCategory[0].category
            : '';
        toaster.positive(
          `Category updated to ${updatedCategory}`,
          {autoHideDuration: 3000}
        );
        getHandleClose(false)();
      },
      onError: error => {
        toaster.negative(error.message);
      },
    }
  );

  const handleSave = () => {
    if (!items || items.length === 0) {
      return;
    }
    const names = [...new Set(items.map(item => item.name))];
    editItemsCategory({
      variables: {
        names,
        newCategory,
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={getHandleClose(true)}
    >
      <ModalHeader>
        {items && items.length === 1
          ? `Edit Category for ${items[0].name}`
          : `Edit Category for ${items.length} items`}
      </ModalHeader>
      <ModalBody>
        <CategorySelect
          placeholder="Select or create a category"
          value={newCategory}
          onChange={value => setNewCategory(value)}
        />
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind="tertiary"
          onClick={getHandleClose(true)}
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
