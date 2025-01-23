import React, {useEffect, useState} from 'react';
import {Block} from 'baseui/block';
import {gql, useMutation} from '@apollo/client';
import {
  StatefulDataTable,
  CategoricalColumn,
  NumericalColumn,
  StringColumn,
  NUMERICAL_FORMATS,
  DatetimeColumn,
} from 'baseui/data-table';
import {toaster} from 'baseui/toast';
import {Button, SIZE} from 'baseui/button';
import {Drawer} from 'baseui/drawer';

import {Pencil} from '../../icons';
import EditPurchase from './edit-purchase';

const columns = [
  StringColumn({
    title: 'Name',
    mapDataToValue: data => data.name,
  }),
  NumericalColumn({
    title: 'Quantity',
    fillWidth: false,
    precision: 3,
    mapDataToValue: data => data.quantity,
  }),
  StringColumn({
    title: 'Unit',
    fillWidth: false,
    mapDataToValue: data => data.unit,
  }),
  NumericalColumn({
    title: 'Price (zł)',
    precision: 3,
    fillWidth: false,
    mapDataToValue: data => data.price,
  }),
  CategoricalColumn({
    title: 'Category',
    fillWidth: false,
    mapDataToValue: data => data.category,
  }),
  NumericalColumn({
    title: 'Discount',
    fillWidth: false,
    format: NUMERICAL_FORMATS.PERCENTAGE,
    precision: 0,
    mapDataToValue: data => data.discount,
  }),
  DatetimeColumn({
    title: 'Date',
    fillWidth: false,
    mapDataToValue: data => +data.date,
    formatString: 'MM-dd-yyyy',
    filterable: false,
  }),
  StringColumn({
    title: 'Note',
    mapDataToValue: data => data.note,
  }),
];

const handleInitialData = data => data.map(r => ({
  id: String(r.id),
  data: r,
}));

const DELETE_PURCHASES = gql`
  mutation DeletePurchases($ids: [ID!]!) {
    deletePurchases(ids: $ids)
  }
`;

export default function Table({data}) {
  const [editRow, setEditRow] = useState(null);
  const [rows, setRows] = useState([]);
  const [deletePurchases] = useMutation(DELETE_PURCHASES, {
    refetchQueries: ['GetPurchasesByDate'],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    data && setRows(handleInitialData(data));
  }, [data]);

  const batchActions = [
    {
      label: 'Delete selected',
      onClick: async ({clearSelection, selection}) => {
        const ids = selection.map(s => s.id);
        const toasterKey = toaster.warning(
          <Block>
            <Block>
              {`Confirm Delete of ${ids.length} items!`}
            </Block>
            <Button
              onClick={() => {
                deletePurchases({
                  variables: {ids},
                  onCompleted: () => {
                    toaster.clear(toasterKey);
                    clearSelection();
                    toaster.positive('Selected purchases deleted successfully!', {autoHideDuration: 3000});
                  },
                });
              }}
              size={SIZE.mini}
            >
              Okay
            </Button>
          </Block>, {
            closeable: true,
            autoHideDuration: 20000,
          });
      },
    },
  ];

  const rowActions = [
    {
      label: 'Edit',
      onClick: ({row: {data: {__typename, ...data}}}) => setEditRow(data),
      renderIcon: Pencil,
    },
  ];

  return (
    <>
      <Drawer
        isOpen={Boolean(editRow)}
        autoFocus
        onClose={() => setEditRow(null)}
      >
        {Boolean(editRow) && (
          <EditPurchase
            initialData={editRow}
            onClose={() => setEditRow(null)}
          />
        )}
      </Drawer>
      <Block
        height="100%"
        width="100%"
      >
        <StatefulDataTable
          batchActions={batchActions}
          rowActions={rowActions}
          columns={columns}
          rows={rows}
        />
      </Block>
    </>
  );
}
