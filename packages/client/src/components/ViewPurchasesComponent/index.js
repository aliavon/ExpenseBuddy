import React, {useState, useMemo} from 'react';
import {gql, useQuery, NetworkStatus} from '@apollo/client';
import {FormControl} from 'baseui/form-control';
import {DatePicker} from 'baseui/datepicker';
import {Block} from 'baseui/block';
import {LabelMedium, LabelLarge} from 'baseui/typography';

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

const ViewPurchasesComponent = () => {
  const [dateRange, setDateRange] = useState(() => {
    let date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return [date, new Date()];
  });

  const {data, loading, networkStatus} = useQuery(GET_PURCHASES_BY_DATE, {
    variables: {
      startDate: dateRange[0]?.toISOString() || new Date().toISOString(),
      endDate: dateRange[1]?.toISOString() || new Date().toISOString(),
    },
    notifyOnNetworkStatusChange: true,
    skip: !dateRange[0] || !dateRange[1],
  });

  const totalSpending = useMemo(() => data?.purchasesByDate?.reduce((sum, purchase) => sum + purchase.price, 0) || 0, [data]);

  const lastTransactionDate = useMemo(() => [...(data?.purchasesByDate || [])].sort((a, b) => b.date - a.date)[0]?.date, [data]);

  if (loading && networkStatus === NetworkStatus.loading) {
    return 'Loading...';
  }

  return (
    <Block
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
    >
      <LabelLarge>View Purchases</LabelLarge>
      <FormControl label="Select Date Range">
        <DatePicker
          value={dateRange}
          onChange={({date}) => setDateRange(Array.isArray(date) ? date : [date])}
          range
        />
      </FormControl>
      <Block
        display="flex"
        gridColumnGap="20px"
      >
        <LabelMedium>
          Sum:
          {` ${totalSpending.toFixed(2)} zł`}
        </LabelMedium>
        <LabelMedium color="accent600">
          {'Last: '}
          {getDate(lastTransactionDate)}
        </LabelMedium>
      </Block>
      <Table data={data?.purchasesByDate} />
    </Block>
  );
};

export default ViewPurchasesComponent;
