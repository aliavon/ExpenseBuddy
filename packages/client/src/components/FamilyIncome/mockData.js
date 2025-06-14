export const mockFamilyIncomeData = {
  getFamilyIncomeRecords: {
    items: [
      {
        id: '1',
        date: '2024-01-15',
        amount: 75000,
        note: 'Основная зарплата',
        periodicity: 'monthly',
        type: {
          id: '1',
          name: 'Зарплата',
          description: 'Основной доход от работы',
        },
        contributor: {
          id: '1',
          fullName: 'Иван Петров',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
        },
      },
      {
        id: '2',
        date: '2024-01-20',
        amount: 25000,
        note: 'Фриланс проект',
        periodicity: 'once',
        type: {
          id: '2',
          name: 'Фриланс',
          description: 'Дополнительный доход от фриланса',
        },
        contributor: {
          id: '1',
          fullName: 'Иван Петров',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
        },
      },
      {
        id: '3',
        date: '2024-01-10',
        amount: 45000,
        note: 'Зарплата жены',
        periodicity: 'monthly',
        type: {
          id: '1',
          name: 'Зарплата',
          description: 'Основной доход от работы',
        },
        contributor: {
          id: '2',
          fullName: 'Мария Петрова',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
        },
      },
      {
        id: '4',
        date: '2024-01-05',
        amount: 12000,
        note: 'Доход от инвестиций',
        periodicity: 'monthly',
        type: {
          id: '3',
          name: 'Инвестиции',
          description: 'Пассивный доход от инвестиций',
        },
        contributor: {
          id: '1',
          fullName: 'Иван Петров',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
        },
      },
      {
        id: '5',
        date: '2024-01-25',
        amount: 8000,
        note: 'Продажа вещей',
        periodicity: 'once',
        type: {
          id: '4',
          name: 'Разное',
          description: 'Прочие доходы',
        },
        contributor: {
          id: '2',
          fullName: 'Мария Петрова',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
        },
      },
      {
        id: '6',
        date: '2024-02-01',
        amount: 3500,
        note: 'Кэшбек от банка',
        periodicity: 'monthly',
        type: {
          id: '4',
          name: 'Разное',
          description: 'Прочие доходы',
        },
        contributor: {
          id: '1',
          fullName: 'Иван Петров',
        },
        currency: {
          id: '1',
          code: 'RUB',
          name: 'Российский рубль',
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

// Функция для фильтрации и сортировки данных
export const filterAndSortMockData = (filters = {}, pagination = {
  page: 1,
  limit: 10,
}, sort = {
  sortBy: 'date',
  sortOrder: 'desc',
}) => {
  let filteredItems = [...mockFamilyIncomeData.getFamilyIncomeRecords.items];

  // Применяем фильтры
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

  // Применяем сортировку
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

  // Применяем пагинацию
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
