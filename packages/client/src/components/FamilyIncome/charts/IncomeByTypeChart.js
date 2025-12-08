import React from 'react';
import { Block } from 'baseui/block';
import { Card } from 'baseui/card';
import { HeadingSmall, LabelMedium } from 'baseui/typography';
import { Spinner } from 'baseui/spinner';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_INCOME_BY_TYPE_QUERY } from '../../../gql/income';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

const IncomeByTypeChart = ({ dateFrom, dateTo }) => {
  const { data, loading, error } = useQuery(GET_INCOME_BY_TYPE_QUERY, {
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

  const chartData = data?.getIncomeByType || [];

  if (chartData.length === 0) {
    return (
      <Card>
        <HeadingSmall marginTop="0" marginBottom="scale300">
          Income by Type
        </HeadingSmall>
        <LabelMedium color="contentSecondary">No data available for selected period</LabelMedium>
      </Card>
    );
  }

  const formattedData = chartData.map(item => ({
    name: item.type.name,
    value: item.amount,
    percentage: item.percentage,
  }));

  const renderCustomLabel = ({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`;

  return (
    <Card>
      <HeadingSmall marginTop="0" marginBottom="scale600">
        Income by Type
      </HeadingSmall>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={value => `$${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default IncomeByTypeChart;

