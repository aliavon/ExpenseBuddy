import React, {useState} from 'react';
import {useQuery} from '@apollo/client';
import {Select} from 'baseui/select';

import {GET_CATEGORIES} from '../../gql';

const CategorySelect = ({value, onChange, ...restProps}) => {
  const [options, setOptions] = useState([]);
  const {loading, error} = useQuery(GET_CATEGORIES, {
    nextFetchPolicy: 'cache-and-network',
    onCompleted: data => {
      const categories = data.getCategories || [];
      setOptions(categories.map(category => ({
        id: category,
        label: category,
      })));
    },
  });

  return (
    <Select
      options={options}
      value={value ? [
        {
          id: value,
          label: value,
        },
      ] : []}
      onChange={params => {
        onChange(params?.option?.id);
      }}
      placeholder="Select or create a category"
      creatable
      isLoading={loading}
      clearable
      error={!!error}
      {...restProps}
    />
  );
};

export default CategorySelect;
