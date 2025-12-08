import React from 'react';
import { Block } from 'baseui/block';
import { Card } from 'baseui/card';
import { HeadingXLarge, LabelMedium } from 'baseui/typography';
import { Spinner } from 'baseui/spinner';
import { useQuery } from '@apollo/client';
import { GET_INCOME_STATISTICS_QUERY } from '../../../gql/income';

const StatCard = ({ title, value, loading }) => (
  <Card>
    {loading ? (
      <Block
        display="flex" justifyContent="center"
        alignItems="center" minHeight="100px">
        <Spinner />
      </Block>
    ) : (
      <Block>
        <HeadingXLarge marginTop="0" marginBottom="scale300">
          {value}
        </HeadingXLarge>
        <LabelMedium color="contentSecondary">{title}</LabelMedium>
      </Block>
    )}
  </Card>
);

const IncomeStatisticsCards = ({ dateFrom, dateTo }) => {
  const { data, loading, error } = useQuery(GET_INCOME_STATISTICS_QUERY, {
    variables: { dateFrom, dateTo },
    skip: !dateFrom || !dateTo,
  });

  if (error) {
    return (
      <LabelMedium color="negative">
        Failed to load statistics:
        {' '}
        {error.message}
      </LabelMedium>
    );
  }

  const stats = data?.getIncomeStatistics;

  return (
    <Block
      display="grid"
      gridTemplateColumns={[
        '1fr',
        '1fr',
        '1fr 1fr',
        '1fr 1fr 1fr 1fr',
      ]}
      gridGap="scale600"
      marginBottom="scale800"
    >
      <StatCard
        title="Total Income"
        value={stats ? `$${stats.totalIncome.toFixed(2)}` : '-'}
        loading={loading}
      />
      <StatCard
        title="Average Income"
        value={stats ? `$${stats.averageIncome.toFixed(2)}` : '-'}
        loading={loading}
      />
      <StatCard
        title="Income Count"
        value={stats?.incomeCount || '-'}
        loading={loading}
      />
      <StatCard
        title="Top Contributor"
        value={
          stats?.topContributor
            ? `${stats.topContributor.firstName} ${stats.topContributor.lastName}`
            : 'N/A'
        }
        loading={loading}
      />
    </Block>
  );
};

export default IncomeStatisticsCards;

