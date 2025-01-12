import React, {useState, useMemo} from 'react';
import {gql, useQuery, useMutation, NetworkStatus} from '@apollo/client';
import {FormControl} from 'baseui/form-control';
import {DatePicker} from 'baseui/datepicker';
import {Button} from 'baseui/button';
import {toaster} from 'baseui/toast';
import {Block} from 'baseui/block';
import {TableBuilder, TableBuilderColumn} from 'baseui/table-semantic';
import {Checkbox} from 'baseui/checkbox';
import {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalButton,
} from 'baseui/modal';
import EditFieldComponent from './edit-field';

import Table from './table-data';

const getDate = value => {
  let date = new Date(value).toLocaleDateString();

  if (date === 'Invalid Date') {
    date = new Date(+value).toLocaleDateString();
  }

  return date;
};

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

const ViewPurchasesComponent = () => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  const [isOpen, setIsOpen] = React.useState(false);
  const [dateRange, setDateRange] = useState(() => {
    let date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return [date, new Date()];
  });

  const [data, setData] = useState([]);
  const selectedIds = useMemo(() => data.filter(({selected}) => selected).map(({id}) => id), [data]);

  const {refetch, loading, networkStatus} = useQuery(GET_PURCHASES_BY_DATE, {
    variables: {
      startDate: dateRange[0]?.toISOString() || new Date().toISOString(),
      endDate: dateRange[1]?.toISOString() || new Date().toISOString(),
    },
    onCompleted: ({purchasesByDate}) => {
      setData(purchasesByDate);
    },
    notifyOnNetworkStatusChange: true,
    skip: !dateRange[0] || !dateRange[1],
  });

  const [deletePurchases] = useMutation(DELETE_PURCHASES);

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('No purchases selected for deletion.');
      return;
    }
    try {
      await deletePurchases({variables: {ids: selectedIds}});
      toaster.positive('Selected purchases deleted successfully!', {autoHideDuration: 3000});
      await refetch();
      toggleClose();
    } catch (error) {
      console.error('Error deleting purchases:', error);
    }
  };

  const hasAny = Boolean(data.length);
  const hasAll = hasAny && data.every(x => x.selected);
  const hasSome = hasAny && data.some(x => x.selected);

  function toggleAll() {
    setData(data =>
      data.map(row => ({
        ...row,
        selected: !hasAll,
      })),
    );
  }

  function toggle(event) {
    const {name, checked} = event.currentTarget;

    setData(data =>
      data.map(row => ({
        ...row,
        selected: String(row.id) === name ? checked : row.selected,
      })),
    );
  }

  function toggleClose() {
    setIsOpen(prev => !prev);
  }

  const totalSpending = data?.reduce((sum, purchase) => sum + purchase.price, 0) || 0;

  const sortedData = useMemo(() => data.slice().sort((a, b) => {
    const left = sortAsc ? a : b;
    const right = sortAsc ? b : a;
    const leftValue = String(left[sortColumn]);
    const rightValue = String(right[sortColumn]);

    return leftValue.localeCompare(rightValue, 'en', {
      numeric: true,
      sensitivity: 'base',
    });
  }), [sortColumn, sortAsc, data]);

  function handleSort(id) {
    if (id === sortColumn) {
      setSortAsc(asc => !asc);
    } else {
      setSortColumn(id);
      setSortAsc(true);
    }
  }

  if (loading && networkStatus === NetworkStatus.loading) {
    return 'Loading';
  }

  return (
    <>
      <Modal
        onClose={toggleClose}
        isOpen={isOpen}
      >
        <ModalHeader>
          {`Confirm Delete of ${selectedIds.length} items`}
        </ModalHeader>
        <ModalFooter>
          <ModalButton onClick={handleDelete}>Okay</ModalButton>
        </ModalFooter>
      </Modal>
      <Block
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
      >
        <h2>View Purchases</h2>
        <FormControl label="Select Date Range">
          <DatePicker
            value={dateRange}
            onChange={({date}) => setDateRange(Array.isArray(date) ? date : [date])}
            range
          />
        </FormControl>
        <Button
          onClick={toggleClose}
          disabled={selectedIds.length === 0}
        >
          Delete Selected
        </Button>
        <h3>
          Total Spending:
          {` ${totalSpending.toFixed(2)} zł`}
        </h3>
        <TableBuilder
          data={sortedData}
          sortColumn={sortColumn}
          sortOrder={sortAsc ? 'ASC' : 'DESC'}
          onSort={handleSort}
          size="compact"
        >
          <TableBuilderColumn
            overrides={{
              // TableHeadCell: {style: {width: '1%'}},
              TableBodyCell: {style: {width: '1%'}},
            }}
            header={(
              <Checkbox
                checked={hasAll}
                isIndeterminate={!hasAll && hasSome}
                onChange={toggleAll}
              />
            )}
          >
            {row => (
              <Checkbox
                name={`${row.id}`}
                checked={row.selected}
                onChange={toggle}
              />
            )}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Name"
            id="name"
            sortable
          >
            {row => row.name}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Quantity"
            id="quantity"
            numeric
          >
            {row => row.quantity}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Unit"
            id="unit"
          >
            {row => row.unit}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Price (zł)"
            id="price"
            sortable
            numeric
          >
            {row => `${row.price.toFixed(2)}`}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Category"
            id="category"
            sortable
          >
            {row => row.category}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Discount"
            id="discount"
            numeric
          >
            {row => `${row.discount}%`}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Date"
            id="date"
            sortable
          >
            {row => getDate(row.date)}
          </TableBuilderColumn>
          <TableBuilderColumn
            overrides={{TableBodyCell: {component: EditFieldComponent}}}
            header="Note"
            id="note"
          >
            {row => row.note}
          </TableBuilderColumn>
        </TableBuilder>
        {/* <Table dateRange={dateRange} /> */}
      </Block>
    </>
  );
};

export default ViewPurchasesComponent;
