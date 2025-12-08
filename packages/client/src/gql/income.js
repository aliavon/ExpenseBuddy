import { gql } from '@apollo/client';

// ============================================
// QUERIES
// ============================================

export const GET_FAMILY_INCOME_RECORDS_QUERY = gql`
  query GetFamilyIncomeRecords(
    $filters: FamilyIncomeFiltersInput
    $pagination: PaginationInput!
    $sort: SortInput
  ) {
    getFamilyIncomeRecords(
      filters: $filters
      pagination: $pagination
      sort: $sort
    ) {
      items {
        id
        date
        amount
        note
        periodicity
        type {
          id
          name
          description
        }
        contributor {
          id
          fullName
        }
        currency {
          id
          code
          name
          symbol
        }
      }
      pagination {
        currentPage
        nextPage
        totalPages
        totalCount
      }
    }
  }
`;

export const GET_INCOME_TYPES_QUERY = gql`
  query GetIncomeTypes {
    getIncomeTypes {
      id
      name
      description
    }
  }
`;

export const GET_CURRENCIES_QUERY = gql`
  query GetCurrencies {
    getCurrencies {
      id
      name
      code
      symbol
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

export const CREATE_FAMILY_INCOME_MUTATION = gql`
  mutation CreateFamilyIncomes($familyIncomes: [FamilyIncomeInput!]!) {
    createFamilyIncomes(familyIncomes: $familyIncomes) {
      id
      date
      amount
      note
      periodicity
      type {
        id
        name
      }
      contributor {
        id
        fullName
      }
      currency {
        id
        code
        symbol
      }
    }
  }
`;

export const UPDATE_FAMILY_INCOME_MUTATION = gql`
  mutation UpdateFamilyIncomes($updates: [UpdateFamilyIncomeInput!]!) {
    updateFamilyIncomes(updates: $updates) {
      id
      date
      amount
      note
      periodicity
      type {
        id
        name
      }
      contributor {
        id
        fullName
      }
      currency {
        id
        code
        symbol
      }
    }
  }
`;

export const DELETE_FAMILY_INCOME_MUTATION = gql`
  mutation DeleteFamilyIncomes($ids: [ID!]!) {
    deleteFamilyIncomes(ids: $ids)
  }
`;

// ============================================
// ANALYTICS QUERIES
// ============================================

export const GET_INCOME_STATISTICS_QUERY = gql`
  query GetIncomeStatistics($dateFrom: String!, $dateTo: String!) {
    getIncomeStatistics(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalIncome
      averageIncome
      incomeCount
      topContributor {
        id
        firstName
        lastName
      }
      topIncomeType {
        id
        name
      }
    }
  }
`;

export const GET_INCOME_BY_TYPE_QUERY = gql`
  query GetIncomeByType($dateFrom: String!, $dateTo: String!) {
    getIncomeByType(dateFrom: $dateFrom, dateTo: $dateTo) {
      type {
        id
        name
      }
      amount
      count
      percentage
    }
  }
`;

export const GET_INCOME_BY_CONTRIBUTOR_QUERY = gql`
  query GetIncomeByContributor($dateFrom: String!, $dateTo: String!) {
    getIncomeByContributor(dateFrom: $dateFrom, dateTo: $dateTo) {
      contributor {
        id
        firstName
        lastName
      }
      amount
      count
      percentage
    }
  }
`;

export const GET_INCOME_TRENDS_QUERY = gql`
  query GetIncomeTrends($dateFrom: String!, $dateTo: String!) {
    getIncomeTrends(dateFrom: $dateFrom, dateTo: $dateTo) {
      period
      amount
      count
    }
  }
`;

