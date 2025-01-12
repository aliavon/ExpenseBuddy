import React from 'react';
import {Alert, Check} from 'baseui/icon';
import {Block} from 'baseui/block';
import {gql, useQuery, useMutation} from '@apollo/client';
import {
  StatefulDataTable,
  BooleanColumn,
  CategoricalColumn,
  NumericalColumn,
  StringColumn,
  NUMERICAL_FORMATS,
  BatchAction,
  RowAction,
  DatetimeColumn,
} from 'baseui/data-table';
import {toaster, ToasterContainer} from 'baseui/toast';
import {Button, SIZE} from 'baseui/button';

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

const GET_PURCHASES_BY_DATE = gql`
  query GetPurchasesByDate($startDate: String!, $endDate: String!) {
    purchasesByDate: getPurchases(from: $startDate, to: $endDate) {
      id
      name
      quantity
      unit
      price
      category
      discount
      date
      note
    }
  }
`;

const DELETE_PURCHASES = gql`
  mutation DeletePurchases($ids: [ID!]!) {
    deletePurchases(ids: $ids)
  }
`;

export default function Table({dateRange}) {
  const [isOpenConfirmDelete, setIsOpenConfirmDelete] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [deletePurchases] = useMutation(DELETE_PURCHASES, {refetchQueries: ['GetPurchasesByDate'], awaitRefetchQueries: true});
  const {refetch, loading} = useQuery(GET_PURCHASES_BY_DATE, {
    variables: {
      startDate: dateRange[0]?.toISOString() || new Date().toISOString(),
      endDate: dateRange[1]?.toISOString() || new Date().toISOString(),
    },
    onCompleted: ({purchasesByDate}) => {
      setRows(handleInitialData(purchasesByDate));
    },
    notifyOnNetworkStatusChange: true,
    skip: !dateRange[0] || !dateRange[1],
  });

  function flagRows(ids) {
    const nextRows = rows.map(row => {
      if (ids.includes(row.id)) {
        const nextData = [...row.data];
        nextData[1] = !nextData[1];
        return {
          ...row,
          data: nextData,
        };
      }

      return row;
    });
    setRows(nextRows);
  }

  function flagRow(id) {
    flagRows([id]);
  }

  function removeRows(ids) {
    const nextRows = rows.filter(row => !ids.includes(row.id));
    setRows(nextRows);
  }
  function removeRow(id) {
    removeRows([id]);
  }

  function toggleModal() {
    setIsOpenConfirmDelete(prev => !prev);
  }

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
          </Block>, {closeable: true, autoHideDuration: 20000});
      },
    },
  ];

  const rowActions = [];

  return (
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
  );
}
