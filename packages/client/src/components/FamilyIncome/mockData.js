export const mockFamilyIncomeData = {
  getFamilyIncomeRecords: {
    items: [
      {
        id: '1',
        date: '2024-01-15',
        amount: 75000,
        note: 'Main salary',
        periodicity: 'monthly',
        type: {
          id: '1',
          name: 'Salary',
          description: 'Primary income from work',
        },
        contributor: {
          id: '1',
          fullName: 'Ivan Petrov',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
      {
        id: '2',
        date: '2024-01-20',
        amount: 25000,
        note: 'Freelance project',
        periodicity: 'once',
        type: {
          id: '2',
          name: 'Freelance',
          description: 'Additional income from freelancing',
        },
        contributor: {
          id: '1',
          fullName: 'Ivan Petrov',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
      {
        id: '3',
        date: '2024-01-10',
        amount: 45000,
        note: 'Wife\'s salary',
        periodicity: 'monthly',
        type: {
          id: '1',
          name: 'Salary',
          description: 'Primary income from work',
        },
        contributor: {
          id: '2',
          fullName: 'Maria Petrova',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
      {
        id: '4',
        date: '2024-01-05',
        amount: 12000,
        note: 'Investment income',
        periodicity: 'monthly',
        type: {
          id: '3',
          name: 'Investments',
          description: 'Passive income from investments',
        },
        contributor: {
          id: '1',
          fullName: 'Ivan Petrov',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
      {
        id: '5',
        date: '2024-01-25',
        amount: 8000,
        note: 'Sale of items',
        periodicity: 'once',
        type: {
          id: '4',
          name: 'Miscellaneous',
          description: 'Other income',
        },
        contributor: {
          id: '2',
          fullName: 'Maria Petrova',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
      {
        id: '6',
        date: '2024-02-01',
        amount: 3500,
        note: 'Bank cashback',
        periodicity: 'monthly',
        type: {
          id: '4',
          name: 'Miscellaneous',
          description: 'Other income',
        },
        contributor: {
          id: '1',
          fullName: 'Ivan Petrov',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Russian Ruble',
        },
      },
    ],
    pagination: {
      currentPage: 1,
      nextPage: null,
      totalPages: 1,
      totalCount: 6,
    },
  },
};

// Function for filtering and sorting data
export const filterAndSortMockData = (filters = {}, pagination = {}, sort = {}) => ({
  getFamilyIncomeRecords: {
    items: [
      {
        id: '1',
        date: '2023-01-01',
        amount: 1000,
        note: 'Test income',
        periodicity: 'monthly',
        type: {
          id: '1',
          name: 'Salary',
        },
        contributor: {
          id: '1',
          fullName: 'John Doe',
        },
        currency: {
          id: '1',
          code: 'USD',
          name: 'US Dollar',
        },
      },
    ],
    pagination: {
      currentPage: pagination.page || 1,
      nextPage: 2,
      totalPages: 5,
      totalCount: 50,
    },
  },
});
