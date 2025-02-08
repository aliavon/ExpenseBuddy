import React from 'react';
import {useQuery} from '@apollo/client';
import {Select} from 'baseui/select';

import {GET_ITEMS_BY_CATEGORY_QUERY} from '../../gql';

const NameSelect = ({value, onChange, category, ...restProps}) => {
  const {data, loading, error} = useQuery(GET_ITEMS_BY_CATEGORY_QUERY, {
    variables: {category: category || ''},
    nextFetchPolicy: 'cache-and-network',
  });

  return (
    <Select
      options={data?.items || []}
      value={value ? [
        {
          id: value,
          label: value,
        },
      ] : []}
      onChange={params => {
        onChange(params?.option?.label);
      }}
      placeholder="Select or add Name"
      creatable
      isLoading={loading}
      clearable
      error={!!error}
      {...restProps}
    />
  );
};

export default NameSelect;
