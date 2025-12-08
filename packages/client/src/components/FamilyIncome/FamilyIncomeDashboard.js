import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Spinner } from 'baseui/spinner';
import { Notification } from 'baseui/notification';
import { Button, SIZE, SHAPE } from 'baseui/button';
import { useQuery } from '@apollo/client';
import Plus from 'baseui/icon/plus';
import { Tabs, Tab } from 'baseui/tabs-motion';
import FamilyIncomeFilters from './FamilyIncomeFilters';
import FamilyIncomeTable from './FamilyIncomeTable';
import AddIncomeModal from './AddIncomeModal';
import EditIncomeModal from './EditIncomeModal';
import DeleteIncomeDialog from './DeleteIncomeDialog';
import IncomeStatisticsCards from './charts/IncomeStatisticsCards';
import IncomeByTypeChart from './charts/IncomeByTypeChart';
import IncomeByContributorChart from './charts/IncomeByContributorChart';
import { GET_FAMILY_INCOME_RECORDS_QUERY } from '../../gql/income';

// Helper to get default date range (start of year to today)
const getDefaultDateRange = () => {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(0);
  startDate.setHours(0, 0, 0, 0);
  return [startDate, new Date()];
};

const FamilyIncomeDashboard = () => {
  // State for tabs
  const [activeTab, setActiveTab] = useState('0');

  // State for filters - initialize with default dates
  const [filters, setFilters] = useState(() => {
    const [dateFrom, dateTo] = getDefaultDateRange();
    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  });

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [deletingIncome, setDeletingIncome] = useState(null);

  // GraphQL query - get all records, DataTable will handle pagination
  const { data, loading, error, refetch } = useQuery(GET_FAMILY_INCOME_RECORDS_QUERY, {
    variables: {
      filters,
      pagination: { page: 1, limit: 1000 }, // Get all records
      sort: { sortBy: 'date', sortOrder: 'desc' },
    },
    fetchPolicy: 'cache-and-network',
  });

  const handleFilterChange = newFilters => {
    setFilters({
      dateFrom: newFilters.dateFrom,
      dateTo: newFilters.dateTo,
    });
  };

  if (loading) {
    return (
      <Block
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Spinner />
      </Block>
    );
  }

  if (error) {
    return (
      <Block margin="scale800">
        <Notification kind="negative" overrides={{ Body: { style: { width: '100%' } } }}>
          Failed to load income records:
          {' '}
          {error.message}
        </Notification>
      </Block>
    );
  }

  const records = data.getFamilyIncomeRecords.items || [];

  return (
    <Block
      width="100%" margin="scale800"
      display="grid" gridTemplateRows="auto 1fr">
      <FamilyIncomeFilters
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />

      <Tabs
        activeKey={activeTab}
        onChange={({ activeKey }) => setActiveTab(activeKey)}
      >
        <Tab title="Records" overrides={{ TabPanel: { style: { height: 'calc(100% - 96px)' } } }}>
          <FamilyIncomeTable
            data={records}
            onEdit={setEditingIncome}
            onDelete={setDeletingIncome}
          />
        </Tab>

        <Tab title="Analytics">
          {filters.dateFrom && filters.dateTo ? (
            <>
              <IncomeStatisticsCards
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
              />
              <Block
                display="grid"
                gridTemplateColumns={['1fr', '1fr', '1fr 1fr']}
                gridGap="scale800"
                marginTop="scale800"
              >
                <IncomeByTypeChart
                  dateFrom={filters.dateFrom}
                  dateTo={filters.dateTo}
                />
                <IncomeByContributorChart
                  dateFrom={filters.dateFrom}
                  dateTo={filters.dateTo}
                />
              </Block>
            </>
          ) : (
            <Notification kind="info">
              Please select a date range to view analytics.
            </Notification>
          )}
        </Tab>
      </Tabs>

      {/* FAB button for adding income */}
      <Button
        onClick={() => setIsAddModalOpen(true)}
        shape={SHAPE.circle}
        size={SIZE.compact}
        overrides={{
          BaseButton: {
            style: {
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000,
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
        }}
      >
        <Plus />
      </Button>

      {/* Modals */}
      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        refetch={refetch}
      />
      <EditIncomeModal
        income={editingIncome}
        isOpen={!!editingIncome}
        onClose={() => setEditingIncome(null)}
        refetch={refetch}
      />
      <DeleteIncomeDialog
        income={deletingIncome}
        isOpen={!!deletingIncome}
        onClose={() => setDeletingIncome(null)}
        refetch={refetch}
      />
    </Block>
  );
};

export default FamilyIncomeDashboard;
