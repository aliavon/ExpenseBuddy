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
    const {item, ...form} = formData;
    await updatePurchase({
      variables: {
        purchase: {
          id: formData.id,
          ...form,
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
      <LabelLarge paddingBottom="10px">{formData.item.name}</LabelLarge>

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
      <Input
        value={formData.item.category}
        placeholder="Update category via update Category func"
        disabled
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
        onChange={({date}) => handleChange('date', date.getTime().toString())}
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
