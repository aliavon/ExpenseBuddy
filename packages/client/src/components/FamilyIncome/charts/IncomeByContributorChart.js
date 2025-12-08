import React from 'react';
import { Block } from 'baseui/block';
import { Card } from 'baseui/card';
import { HeadingSmall, LabelMedium } from 'baseui/typography';
import { Spinner } from 'baseui/spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_INCOME_BY_CONTRIBUTOR_QUERY } from '../../../gql/income';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

const IncomeByContributorChart = ({ dateFrom, dateTo }) => {
  const { data, loading, error } = useQuery(GET_INCOME_BY_CONTRIBUTOR_QUERY, {
    variables: { dateFrom, dateTo },
    skip: !dateFrom || !dateTo,
  });

  if (loading) {
    return (
      <Card>
        <Block
          display="flex" justifyContent="center"
          alignItems="center" minHeight="300px">
          <Spinner />
        </Block>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <LabelMedium color="negative">
          Failed to load chart:
          {error.message}
        </LabelMedium>
      </Card>
    );
  }

  const chartData = data?.getIncomeByContributor || [];

  if (chartData.length === 0) {
    return (
      <Card>
        <HeadingSmall marginTop="0" marginBottom="scale300">
          Income by Contributor
        </HeadingSmall>
        <LabelMedium color="contentSecondary">No data available for selected period</LabelMedium>
      </Card>
    );
  }

  const formattedData = chartData.map(item => ({
    name: `${item.contributor.firstName} ${item.contributor.lastName}`,
    value: item.amount,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <HeadingSmall marginTop="0" marginBottom="scale600">
        Income by Contributor
      </HeadingSmall>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={formattedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={value => `$${value}`}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
          />
          <Tooltip formatter={value => `$${value.toFixed(2)}`} />
          <Bar dataKey="value">
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default IncomeByContributorChart;

