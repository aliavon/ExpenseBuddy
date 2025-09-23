import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
// import {useQuery, gql} from '@apollo/client';
import FamilyIncomeFilters from './FamilyIncomeFilters';
import FamilyIncomeTable from './FamilyIncomeTable';
import { filterAndSortMockData } from './mockData';

// const GET_FAMILY_INCOME_RECORDS = gql`
//   query GetFamilyIncomeRecords($filters: FamilyIncomeFiltersInput, $pagination: PaginationInput!, $sort: SortInput) {
//     getFamilyIncomeRecords(filters: $filters, pagination: $pagination, sort: $sort) {
//       items {
//         id
//         date
//         amount
//         note
//         periodicity
//         type {
//           id
//           name
//           description
//         }
//         contributor {
//           id
//           fullName
//         }
//         currency {
//           id
//           code
//           name
//         }
//       }
//       pagination {
//         currentPage
//         nextPage
//         totalPages
//         totalCount
//       }
//     }
//   }
// `;

const FamilyIncomeDashboard = () => {
  // State for filters, pagination, and sorting
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [sort, setSort] = useState({
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // State for mock data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate data fetching with mock data
  useEffect(() => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Simulate network delay
      setTimeout(() => {
        try {
          const mockData = filterAndSortMockData(filters, pagination, sort);
          setData(mockData);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      }, 300);
    } catch (err) {
      // This catch is for setTimeout setup errors (unlikely but possible)
      setError(err);
      setLoading(false);
    }
  }, [filters, pagination, sort]);

  // GraphQL query (commented out)
  // const {data, loading, error, refetch} = useQuery(GET_FAMILY_INCOME_RECORDS, {
  //   variables: {
  //     filters,
  //     pagination,
  //     sort,
  //   },
  // });

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
    // Reset to first page on filter change
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handleSortChange = newSort => {
    setSort(prev => ({
      ...prev,
      ...newSort,
    }));
  };

  const handlePageChange = newPage => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  // Removed refetch useEffect since we're using mock data
  // useEffect(() => {
  //   refetch({
  //     filters,
  //     pagination,
  //     sort,
  //   });
  // }, [
  //   filters,
  //   pagination,
  //   sort,
  //   refetch,
  // ]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return (
      <div>
        Error:
        {error.message}
      </div>
    );
  }

  const records = data.getFamilyIncomeRecords.items;
  const paginationMeta = data.getFamilyIncomeRecords.pagination;

  return (
    <Box p={2}>
      <Paper
        sx={{
          p: 2,
          mb: 2,
        }}
      >
        <FamilyIncomeFilters onFilterChange={handleFilterChange} />
      </Paper>
      <FamilyIncomeTable
        data={records}
        totalPages={paginationMeta.totalPages}
        currentPage={paginationMeta.currentPage}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
      />
    </Box>
  );
};

export default FamilyIncomeDashboard;
