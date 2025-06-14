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
export const filterAndSortMockData = (filters = {}, pagination = {
  page: 1,
  limit: 10,
}, sort = {
  sortBy: 'date',
  sortOrder: 'desc',
}) => {
  let filteredItems = [...mockFamilyIncomeData.getFamilyIncomeRecords.items];

  // Apply filters
  if (filters.startDate) {
    filteredItems = filteredItems.filter(item => new Date(item.date) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    filteredItems = filteredItems.filter(item => new Date(item.date) <= new Date(filters.endDate));
  }
  if (filters.contributorId) {
    filteredItems = filteredItems.filter(item => item.contributor.id === filters.contributorId);
  }
  if (filters.typeId) {
    filteredItems = filteredItems.filter(item => item.type.id === filters.typeId);
  }
  if (filters.periodicity) {
    filteredItems = filteredItems.filter(item => item.periodicity === filters.periodicity);
  }

  // Apply sorting
  filteredItems.sort((a, b) => {
    let aValue = a[sort.sortBy];
    let bValue = b[sort.sortBy];

    if (sort.sortBy === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sort.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const totalCount = filteredItems.length;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  return {
    getFamilyIncomeRecords: {
      items: paginatedItems,
      pagination: {
        currentPage: pagination.page,
        nextPage: pagination.page < totalPages ? pagination.page + 1 : null,
        totalPages,
        totalCount,
      },
    },
  };
};
