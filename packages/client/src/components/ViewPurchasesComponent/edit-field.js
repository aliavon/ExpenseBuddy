import React, {useState, useEffect} from 'react';
import {gql, useMutation} from '@apollo/client';
import {Input, SIZE} from 'baseui/input';
import {toaster} from 'baseui/toast';
import {StyledTableBodyCell} from 'baseui/table-semantic';
import {Spinner} from 'baseui/spinner';

import {Pencil} from '../../icons';

const whitelist = ['note', 'category', 'name'];

const UPDATE_PURCHASE_DATA = gql`
  mutation UpdatePurchase($purchase: UpdatePurchaseInput!) {
    updatePurchases(updates: [$purchase]) {
      id
    }
  }
`;

const EditFieldComponent = ({children, ...props}) => {
  const currentId = props.$col.id;
  const currentValue = props.$row[currentId];
  const [updatePurchase, {loading}] = useMutation(UPDATE_PURCHASE_DATA, {
    awaitRefetchQueries: true,
    refetchQueries: ['GetPurchasesByDate'],
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [value, setValue] = React.useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  const handleEditModeOn = () => {
    if (!whitelist.includes(currentId)) {
      return;
    }
    setIsEditMode(() => true);
  };

  if (!isEditMode) {
    return (
      <StyledTableBodyCell
        {...props}
        onClick={handleEditModeOn}
      >
        {children}
      </StyledTableBodyCell>
    );
  }

  const handleEditModeOff = () => {
    if (value === currentValue) {
      setIsEditMode(false);
      return;
    }

    updatePurchase({
      variables: {
        purchase: {
          id: props.$row.id,
          [currentId]: value,
        },
      },
      onCompleted: () => {
        setIsEditMode(false);
        toaster.positive(`${props.$col.header} changed from "${currentValue}" to "${value}"`, {autoHideDuration: 3000});
      },
    });
  };

  return (
    <StyledTableBodyCell
      {...props}
    >
      <Input
        overrides={{
          Input: {style: {padding: 0}},
          Root: {style: {padding: 0}},
          StartEnhancer: {
            style: {
              paddingLeft: '2px',
              paddingRight: '4px',
            },
          },
        }}
        size={SIZE.mini}
        onBlur={handleEditModeOff}
        onKeyPress={e => {
          if (e.key === 'Enter') {
            handleEditModeOff();
          }
        }}
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={loading}
        startEnhancer={() => loading ? (
          <Spinner
            $size="10"
            $borderWidth="2"
          />
        ) : (
          <Pencil size={14} />
        )}
        autoFocus
      />
    </StyledTableBodyCell>
  );
};

export default EditFieldComponent;
