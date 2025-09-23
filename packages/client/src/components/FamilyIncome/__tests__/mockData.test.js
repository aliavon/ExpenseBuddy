import { mockFamilyIncomeData, filterAndSortMockData } from '../mockData';

describe('FamilyIncome MockData', () => {
  describe('mockFamilyIncomeData', () => {
    it('should export mockFamilyIncomeData object', () => {
      expect(mockFamilyIncomeData).toBeDefined();
      expect(typeof mockFamilyIncomeData).toBe('object');
    });

    it('should have getFamilyIncomeRecords structure', () => {
      expect(mockFamilyIncomeData.getFamilyIncomeRecords).toBeDefined();
      expect(Array.isArray(mockFamilyIncomeData.getFamilyIncomeRecords.items)).toBe(true);
      expect(mockFamilyIncomeData.getFamilyIncomeRecords.pagination).toBeDefined();
    });

    it('should contain 6 income records', () => {
      expect(mockFamilyIncomeData.getFamilyIncomeRecords.items).toHaveLength(6);
    });

    it('should have correct pagination data', () => {
      const { pagination } = mockFamilyIncomeData.getFamilyIncomeRecords;
      
      expect(pagination.currentPage).toBe(1);
      expect(pagination.nextPage).toBe(null);
      expect(pagination.totalPages).toBe(1);
      expect(pagination.totalCount).toBe(6);
    });

    it('should have correct structure for each income record', () => {
      const firstRecord = mockFamilyIncomeData.getFamilyIncomeRecords.items[0];
      
      expect(firstRecord).toHaveProperty('id');
      expect(firstRecord).toHaveProperty('date');
      expect(firstRecord).toHaveProperty('amount');
      expect(firstRecord).toHaveProperty('note');
      expect(firstRecord).toHaveProperty('periodicity');
      expect(firstRecord).toHaveProperty('type');
      expect(firstRecord).toHaveProperty('contributor');
      expect(firstRecord).toHaveProperty('currency');
    });

    it('should have correct type structure', () => {
      const firstRecord = mockFamilyIncomeData.getFamilyIncomeRecords.items[0];
      
      expect(firstRecord.type).toHaveProperty('id');
      expect(firstRecord.type).toHaveProperty('name');
      expect(firstRecord.type).toHaveProperty('description');
    });

    it('should have correct contributor structure', () => {
      const firstRecord = mockFamilyIncomeData.getFamilyIncomeRecords.items[0];
      
      expect(firstRecord.contributor).toHaveProperty('id');
      expect(firstRecord.contributor).toHaveProperty('fullName');
    });

    it('should have correct currency structure', () => {
      const firstRecord = mockFamilyIncomeData.getFamilyIncomeRecords.items[0];
      
      expect(firstRecord.currency).toHaveProperty('id');
      expect(firstRecord.currency).toHaveProperty('code');
      expect(firstRecord.currency).toHaveProperty('name');
    });

    it('should contain specific test data values', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      
      // First record
      expect(records[0].id).toBe('1');
      expect(records[0].amount).toBe(75000);
      expect(records[0].note).toBe('Main salary');
      expect(records[0].periodicity).toBe('monthly');
      expect(records[0].type.name).toBe('Salary');
      expect(records[0].contributor.fullName).toBe('Ivan Petrov');
      expect(records[0].currency.code).toBe('RUB');
    });

    it('should contain different contributors', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      const contributors = records.map(record => record.contributor.fullName);
      const uniqueContributors = [...new Set(contributors)];
      
      expect(uniqueContributors).toContain('Ivan Petrov');
      expect(uniqueContributors).toContain('Maria Petrova');
      expect(uniqueContributors.length).toBe(2);
    });

    it('should contain different income types', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      const types = records.map(record => record.type.name);
      const uniqueTypes = [...new Set(types)];
      
      expect(uniqueTypes).toContain('Salary');
      expect(uniqueTypes).toContain('Freelance');
      expect(uniqueTypes).toContain('Investments');
      expect(uniqueTypes).toContain('Miscellaneous');
    });

    it('should contain different periodicities', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      const periodicities = records.map(record => record.periodicity);
      const uniquePeriodicities = [...new Set(periodicities)];
      
      expect(uniquePeriodicities).toContain('monthly');
      expect(uniquePeriodicities).toContain('once');
    });

    it('should have valid dates', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      
      records.forEach(record => {
        expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(record.date).getTime()).not.toBeNaN();
      });
    });

    it('should have positive amounts', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      
      records.forEach(record => {
        expect(record.amount).toBeGreaterThan(0);
        expect(typeof record.amount).toBe('number');
      });
    });

    it('should have proper escaped quote in note', () => {
      const record = mockFamilyIncomeData.getFamilyIncomeRecords.items.find(r => r.id === '3');
      expect(record.note).toBe("Wife's salary");
    });
  });

  describe('filterAndSortMockData function', () => {
    it('should export filterAndSortMockData function', () => {
      expect(filterAndSortMockData).toBeDefined();
      expect(typeof filterAndSortMockData).toBe('function');
    });

    it('should return data structure with no parameters', () => {
      const result = filterAndSortMockData();
      
      expect(result).toBeDefined();
      expect(result.getFamilyIncomeRecords).toBeDefined();
      expect(Array.isArray(result.getFamilyIncomeRecords.items)).toBe(true);
      expect(result.getFamilyIncomeRecords.pagination).toBeDefined();
    });

    it('should return same items as original data', () => {
      const result = filterAndSortMockData();
      
      expect(result.getFamilyIncomeRecords.items).toEqual(
        mockFamilyIncomeData.getFamilyIncomeRecords.items
      );
    });

    it('should return modified pagination', () => {
      const result = filterAndSortMockData();
      
      expect(result.getFamilyIncomeRecords.pagination).toEqual({
        currentPage: 1,
        nextPage: 2,
        totalPages: 5,
        totalCount: 50,
      });
    });

    it('should handle custom pagination parameters', () => {
      const result = filterAndSortMockData({}, { page: 3 });
      
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(3);
      expect(result.getFamilyIncomeRecords.pagination.nextPage).toBe(2);
      expect(result.getFamilyIncomeRecords.pagination.totalPages).toBe(5);
      expect(result.getFamilyIncomeRecords.pagination.totalCount).toBe(50);
    });

    it('should handle empty filters parameter', () => {
      const result = filterAndSortMockData({});
      
      expect(result.getFamilyIncomeRecords.items).toEqual(
        mockFamilyIncomeData.getFamilyIncomeRecords.items
      );
    });

    it('should handle empty pagination parameter', () => {
      const result = filterAndSortMockData({}, {});
      
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(1);
    });

    it('should handle empty sort parameter', () => {
      const result = filterAndSortMockData({}, {}, {});
      
      expect(result.getFamilyIncomeRecords.items).toEqual(
        mockFamilyIncomeData.getFamilyIncomeRecords.items
      );
    });

    it('should handle all parameters provided', () => {
      const filters = { contributorId: '1' };
      const pagination = { page: 2 };
      const sort = { field: 'date', direction: 'desc' };
      
      const result = filterAndSortMockData(filters, pagination, sort);
      
      expect(result.getFamilyIncomeRecords.items).toBeDefined();
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(2);
    });

    it('should preserve original data structure', () => {
      const result = filterAndSortMockData();
      
      expect(result.getFamilyIncomeRecords).toHaveProperty('items');
      expect(result.getFamilyIncomeRecords).toHaveProperty('pagination');
    });

    it('should use spread operator correctly', () => {
      const result = filterAndSortMockData();
      
      // Should contain all properties from original except pagination
      expect(result.getFamilyIncomeRecords.items).toEqual(
        mockFamilyIncomeData.getFamilyIncomeRecords.items
      );
    });

    it('should handle undefined page parameter', () => {
      const result = filterAndSortMockData({}, { page: undefined });
      
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(1);
    });

    it('should handle falsy page parameter', () => {
      const result = filterAndSortMockData({}, { page: 0 });
      
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(1);
    });

    it('should handle null page parameter', () => {
      const result = filterAndSortMockData({}, { page: null });
      
      expect(result.getFamilyIncomeRecords.pagination.currentPage).toBe(1);
    });
  });

  describe('Data consistency', () => {
    it('should maintain consistent IDs', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      const ids = records.map(record => record.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(uniqueIds.length).toBe(records.length);
    });

    it('should use consistent currency across records', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      
      records.forEach(record => {
        expect(record.currency.code).toBe('RUB');
        expect(record.currency.name).toBe('Russian Ruble');
      });
    });

    it('should have proper data types', () => {
      const records = mockFamilyIncomeData.getFamilyIncomeRecords.items;
      
      records.forEach(record => {
        expect(typeof record.id).toBe('string');
        expect(typeof record.date).toBe('string');
        expect(typeof record.amount).toBe('number');
        expect(typeof record.note).toBe('string');
        expect(typeof record.periodicity).toBe('string');
        expect(typeof record.type).toBe('object');
        expect(typeof record.contributor).toBe('object');
        expect(typeof record.currency).toBe('object');
      });
    });
  });
});
