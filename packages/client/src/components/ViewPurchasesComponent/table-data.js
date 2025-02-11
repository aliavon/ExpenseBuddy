import React, {useEffect, useState, useRef} from 'react';
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
import {LabelMedium} from 'baseui/typography';
// import {TableBuilder, TableBuilderColumn} from 'baseui/table-semantic';
// todo: refactor to use TableBuilder

import {Pencil, Tag} from '../../icons';
import EditPurchase from './edit-purchase';
import EditItemCategoryModal from './EditItemCategoryModal';

const columns = [
  StringColumn({
    title: 'Name',
    mapDataToValue: data => data.item.name,
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
    mapDataToValue: data => data.item.category,
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
  const ref = useRef();
  const [sum, setSum] = useState(0);
  const [editRow, setEditRow] = useState(null);
  const [editItems, setEditItems] = useState(null);
  const [rows, setRows] = useState([]);
  const [deletePurchases] = useMutation(DELETE_PURCHASES, {
    refetchQueries: ['GetPurchasesByDate'],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    data && setRows(handleInitialData(data));
  }, [data]);

  useEffect(() => {
    const calculateSum = () => {
      const rows = ref.current?.getRows ? ref.current.getRows() : [];
      const total = rows.reduce((acc, row) => acc + (row.data.price || 0), 0);
      setSum(total);
    };

    const intervalId = setInterval(calculateSum, 1000);

    return () => clearInterval(intervalId);
  }, []);

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
    }, {
      label: 'Edit Category',
      onClick: async ({selection}) => {
        setEditItems(selection.map(i => i.data.item));
      },
    },
  ];

  const rowActions = [
    {
      label: 'Edit Purchase',
      onClick: ({row: {data: {__typename, ...data}}}) => setEditRow(data),
      renderIcon: props => (
        <Pencil
          title="Edit Purchase"
          {...props}
        />
      ),
    }, {
      label: 'Edit Category',
      onClick: ({row: {data}}) => setEditItems([data.item]),
      renderIcon: props => (
        <Tag
          title="Edit Category"
          {...props}
        />
      ),
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

      {editItems && (
        <EditItemCategoryModal
          isOpen={Boolean(editItems)}
          clearSelection={() => ref.current.clearSelection()}
          onClose={() => setEditItems(null)}
          items={editItems}
        />
      )}

      <Block
        height="100%"
        width="100%"
        display="flex"
        alignItems="center"
        gridColumnGap="20px"
        flexWrap
      >
        <LabelMedium>
          Sum:
          {` ${sum.toFixed(2)} zł`}
        </LabelMedium>
        <StatefulDataTable
          onSelectionChange={console.log}
          initialSortDirection="DESC"
          initialSortIndex={6} // Date index
          controlRef={ref}
          batchActions={batchActions}
          rowActions={rowActions}
          columns={columns}
          rows={rows}
        />
      </Block>
    </>
  );
}
