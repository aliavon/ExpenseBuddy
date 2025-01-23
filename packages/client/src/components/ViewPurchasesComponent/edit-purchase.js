import React, {useState} from 'react';
import {Input} from 'baseui/input';
import {Button} from 'baseui/button';
import {Textarea} from 'baseui/textarea';
import {DatePicker} from 'baseui/datepicker';
import {useMutation} from '@apollo/client';
import {LabelLarge} from 'baseui/typography';
import {Block} from 'baseui/block';
import {toaster} from 'baseui/toast';

import {UPDATE_PURCHASE_DATA} from '../../gql';
import CategorySelect from '../form/category-select';

const EditPurchase = ({initialData, onClose}) => {
  const [formData, setFormData] = useState(initialData);
  const [updatePurchase, {loading}] = useMutation(UPDATE_PURCHASE_DATA, {
    onCompleted: () => {
      toaster.positive('Purchase updated successfully!');
      onClose?.();
    },
    onError: error => {
      toaster.negative(error.message);
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    await updatePurchase({
      variables: {
        purchase: {
          id: formData.id,
          ...formData,
        },
      },
    });

  };

  return (
    <Block
      display="flex"
      flexDirection="column"
      gridRowGap="14px"
    >
      <LabelLarge paddingBottom="10px">Edit Purchase</LabelLarge>

      {/* Name */}
      <Input
        value={formData.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="Name"
        clearable
      />

      {/* Quantity */}
      <Input
        value={formData.quantity}
        type="number"
        onChange={e => handleChange('quantity', parseInt(e.target.value, 10))}
        placeholder="Quantity"
      />

      {/* Unit */}
      <Input
        value={formData.unit}
        onChange={e => handleChange('unit', e.target.value)}
        placeholder="Unit"
      />

      {/* Price */}
      <Input
        value={formData.price}
        type="number"
        onChange={e => handleChange('price', parseFloat(e.target.value))}
        placeholder="Price"
      />

      {/* Category */}
      <CategorySelect
        value={formData.category}
        onChange={value => handleChange('category', value)}
      />

      {/* Discount */}
      <Input
        value={formData.discount}
        type="number"
        onChange={e => handleChange('discount', parseFloat(e.target.value))}
        placeholder="Discount"
      />

      {/* Date */}
      <DatePicker
        value={new Date(parseInt(formData.date, 10))}
        onChange={({date}) => handleChange('date', date.getTime())}
      />

      {/* Note */}
      <Textarea
        value={formData.note}
        onChange={e => handleChange('note', e.target.value)}
        placeholder="Note"
      />

      <Block
        display="flex"
        gridColumnGap="10px"
        marginTop="20px"
      >
        <Button
          onClick={handleSave}
          loading={loading}
          disabled={loading}
        >
          Save
        </Button>
        <Button
          onClick={onClose}
          kind='secondary'
        >
          Cancel
        </Button>
      </Block>
    </Block>
  );
};

export default EditPurchase;
