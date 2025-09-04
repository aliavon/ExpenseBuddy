const getFamilyIncomeRecords = require("../getFamilyIncomeRecords");
const { FamilyIncome } = require("../../../../database/schemas");

describe("getFamilyIncomeRecords resolver", () => {
  beforeEach(async () => {
    await FamilyIncome.deleteMany({});
  });

  const createFamilyIncomeRecord = (overrides = {}) => ({
    contributorId: global.createMockId(),
    typeId: global.createMockId(),
    currencyId: global.createMockId(),
    amount: 1000,
    date: new Date("2024-01-15"),
    periodicity: "MONTHLY",
    ...overrides,
  });

  it("should return paginated family income records with default sorting", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 1000, date: new Date("2024-01-15") }),
      createFamilyIncomeRecord({ amount: 2000, date: new Date("2024-01-20") }),
      createFamilyIncomeRecord({ amount: 1500, date: new Date("2024-01-10") }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(3);
    expect(result.pagination).toEqual({
      currentPage: 1,
      nextPage: null,
      totalPages: 1,
      totalCount: 3,
    });
    // Default sort by date descending
    expect(result.items[0].date.getTime()).toBeGreaterThanOrEqual(
      result.items[1].date.getTime()
    );
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully retrieved FamilyIncome records"
    );
  });

  it("should filter by date range", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 1000, date: new Date("2024-01-15") }),
      createFamilyIncomeRecord({ amount: 2000, date: new Date("2024-02-15") }),
      createFamilyIncomeRecord({ amount: 1500, date: new Date("2024-03-15") }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: {
          dateFrom: "2024-01-01",
          dateTo: "2024-02-28",
        },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (item) =>
          item.date >= new Date("2024-01-01") &&
          item.date <= new Date("2024-02-28")
      )
    ).toBe(true);
  });

  it("should filter by contributorId", async () => {
    const contributorId1 = global.createMockId();
    const contributorId2 = global.createMockId();

    await FamilyIncome.create([
      createFamilyIncomeRecord({ contributorId: contributorId1, amount: 1000 }),
      createFamilyIncomeRecord({ contributorId: contributorId2, amount: 2000 }),
      createFamilyIncomeRecord({ contributorId: contributorId1, amount: 1500 }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: { contributorId: contributorId1 },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (item) => item.contributorId.toString() === contributorId1
      )
    ).toBe(true);
  });

  it("should filter by typeId", async () => {
    const typeId1 = global.createMockId();
    const typeId2 = global.createMockId();

    await FamilyIncome.create([
      createFamilyIncomeRecord({ typeId: typeId1, amount: 1000 }),
      createFamilyIncomeRecord({ typeId: typeId2, amount: 2000 }),
      createFamilyIncomeRecord({ typeId: typeId1, amount: 1500 }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: { typeId: typeId1 },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every((item) => item.typeId.toString() === typeId1)
    ).toBe(true);
  });

  it("should handle pagination correctly", async () => {
    // Create 15 records
    const records = [];
    for (let i = 1; i <= 15; i++) {
      records.push(
        createFamilyIncomeRecord({
          amount: i * 100,
          date: new Date(`2024-01-${String(i).padStart(2, "0")}`),
        })
      );
    }
    await FamilyIncome.create(records);

    const context = global.createMockContext();

    // Test first page
    const result1 = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 5 },
      },
      context
    );

    expect(result1.items).toHaveLength(5);
    expect(result1.pagination).toEqual({
      currentPage: 1,
      nextPage: 2,
      totalPages: 3,
      totalCount: 15,
    });

    // Test second page
    const result2 = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 2, limit: 5 },
      },
      context
    );

    expect(result2.items).toHaveLength(5);
    expect(result2.pagination).toEqual({
      currentPage: 2,
      nextPage: 3,
      totalPages: 3,
      totalCount: 15,
    });

    // Test last page
    const result3 = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 3, limit: 5 },
      },
      context
    );

    expect(result3.items).toHaveLength(5);
    expect(result3.pagination).toEqual({
      currentPage: 3,
      nextPage: null,
      totalPages: 3,
      totalCount: 15,
    });
  });

  it("should sort by amount ascending", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 3000 }),
      createFamilyIncomeRecord({ amount: 1000 }),
      createFamilyIncomeRecord({ amount: 2000 }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 10 },
        sort: { sortBy: "amount", sortOrder: "ASC" },
      },
      context
    );

    expect(result.items).toHaveLength(3);
    expect(result.items[0].amount).toBe(1000);
    expect(result.items[1].amount).toBe(2000);
    expect(result.items[2].amount).toBe(3000);
  });

  it("should sort by amount descending", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 1000 }),
      createFamilyIncomeRecord({ amount: 3000 }),
      createFamilyIncomeRecord({ amount: 2000 }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 10 },
        sort: { sortBy: "amount", sortOrder: "DESC" },
      },
      context
    );

    expect(result.items).toHaveLength(3);
    expect(result.items[0].amount).toBe(3000);
    expect(result.items[1].amount).toBe(2000);
    expect(result.items[2].amount).toBe(1000);
  });

  it("should handle empty results", async () => {
    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      currentPage: 1,
      nextPage: null,
      totalPages: 0,
      totalCount: 0,
    });
  });

  it("should handle filters with no matches", async () => {
    await FamilyIncome.create([createFamilyIncomeRecord({ amount: 1000 })]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: { contributorId: global.createMockId() }, // Different contributor
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toEqual([]);
    expect(result.pagination.totalCount).toBe(0);
  });

  it("should handle date filter with only dateFrom", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 1000, date: new Date("2024-01-15") }),
      createFamilyIncomeRecord({ amount: 2000, date: new Date("2024-02-15") }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: { dateFrom: "2024-02-01" },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(2000);
  });

  it("should handle date filter with only dateTo", async () => {
    await FamilyIncome.create([
      createFamilyIncomeRecord({ amount: 1000, date: new Date("2024-01-15") }),
      createFamilyIncomeRecord({ amount: 2000, date: new Date("2024-02-15") }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: { dateTo: "2024-01-31" },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(1000);
  });

  it("should handle combined filters", async () => {
    const contributorId1 = global.createMockId();
    const contributorId2 = global.createMockId();
    const typeId1 = global.createMockId();
    const typeId2 = global.createMockId();

    await FamilyIncome.create([
      createFamilyIncomeRecord({
        contributorId: contributorId1,
        typeId: typeId1,
        amount: 1000,
        date: new Date("2024-01-15"),
      }),
      createFamilyIncomeRecord({
        contributorId: contributorId1,
        typeId: typeId2,
        amount: 2000,
        date: new Date("2024-01-15"),
      }),
      createFamilyIncomeRecord({
        contributorId: contributorId2,
        typeId: typeId1,
        amount: 1500,
        date: new Date("2024-01-15"),
      }),
      createFamilyIncomeRecord({
        contributorId: contributorId1,
        typeId: typeId1,
        amount: 3000,
        date: new Date("2024-02-15"),
      }),
    ]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        filters: {
          contributorId: contributorId1,
          typeId: typeId1,
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
        },
        pagination: { page: 1, limit: 10 },
      },
      context
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(1000);
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();

    // Mock FamilyIncome.countDocuments to throw an error
    const originalCountDocuments = FamilyIncome.countDocuments;
    FamilyIncome.countDocuments = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(
      getFamilyIncomeRecords(
        null,
        {
          pagination: { page: 1, limit: 10 },
        },
        context
      )
    ).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.countDocuments = originalCountDocuments;
  });

  it("should handle invalid sort order gracefully", async () => {
    await FamilyIncome.create([createFamilyIncomeRecord({ amount: 1000 })]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 1, limit: 10 },
        sort: { sortBy: "amount", sortOrder: "INVALID" },
      },
      context
    );

    expect(result.items).toHaveLength(1);
    // Should default to descending when invalid sort order provided
  });

  it("should handle page beyond available data", async () => {
    await FamilyIncome.create([createFamilyIncomeRecord({ amount: 1000 })]);

    const context = global.createMockContext();
    const result = await getFamilyIncomeRecords(
      null,
      {
        pagination: { page: 5, limit: 10 }, // Page 5 when only 1 record exists
      },
      context
    );

    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      currentPage: 5,
      nextPage: null,
      totalPages: 1,
      totalCount: 1,
    });
  });
});
