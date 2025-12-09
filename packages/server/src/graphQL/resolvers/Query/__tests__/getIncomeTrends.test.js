const getIncomeTrends = require("../getIncomeTrends");
const { FamilyIncome } = require("../../../../database/schemas");
const mongoose = require("mongoose");

describe("getIncomeTrends resolver", () => {
  let context;
  let familyId;

  beforeEach(async () => {
    await FamilyIncome.deleteMany({});

    context = global.createMockContext();
    familyId = new mongoose.Types.ObjectId(context.auth.user.familyId);
  });

  it("should return income trends for date range", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 2000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1500,
        date: new Date("2024-02-10"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-02-28",
      },
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 3000,
      count: 2,
    });
    expect(result[1]).toEqual({
      period: "2024-02",
      amount: 1500,
      count: 1,
    });
  });

  it("should fill missing months with zeros", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1500,
        date: new Date("2024-03-10"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-03-31",
      },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 1000,
      count: 1,
    });
    expect(result[1]).toEqual({
      period: "2024-02",
      amount: 0,
      count: 0,
    });
    expect(result[2]).toEqual({
      period: "2024-03",
      amount: 1500,
      count: 1,
    });
  });

  it("should return empty trends for range with no data", async () => {
    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-03-31",
      },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ period: "2024-01", amount: 0, count: 0 });
    expect(result[1]).toEqual({ period: "2024-02", amount: 0, count: 0 });
    expect(result[2]).toEqual({ period: "2024-03", amount: 0, count: 0 });
  });

  it("should handle single month range", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 1000,
      count: 1,
    });
  });

  it("should aggregate multiple incomes in same month", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-05"),
        periodicity: "WEEKLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 2000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 500,
        date: new Date("2024-01-25"),
        periodicity: "ONE_TIME",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 3500,
      count: 3,
    });
  });

  it("should only return incomes from user's family", async () => {
    const otherFamilyId = new mongoose.Types.ObjectId();

    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId: otherFamilyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 5000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 1000,
      count: 1,
    });
  });

  it("should handle year boundary", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2023-12-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1500,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2023-12-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      period: "2023-12",
      amount: 1000,
      count: 1,
    });
    expect(result[1]).toEqual({
      period: "2024-01",
      amount: 1500,
      count: 1,
    });
  });

  it("should handle decimal amounts", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000.5,
        date: new Date("2024-01-10"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 2000.75,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: "2024-01",
      amount: 3001.25,
      count: 2,
    });
  });

  it("should handle long date ranges", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date("2024-12-15"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
      },
      context
    );

    expect(result).toHaveLength(12);
    expect(result[0].period).toBe("2024-01");
    expect(result[0].amount).toBe(1000);
    expect(result[11].period).toBe("2024-12");
    expect(result[11].amount).toBe(1000);

    // Check that months 2-11 have zero amounts
    for (let i = 1; i < 11; i++) {
      expect(result[i].amount).toBe(0);
      expect(result[i].count).toBe(0);
    }
  });

  it("should require authentication", async () => {
    const unauthContext = global.createMockContext({
      auth: null,
    });

    await expect(
      getIncomeTrends(
        null,
        {
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
        },
        unauthContext
      )
    ).rejects.toThrow();
  });

  it("should require family membership", async () => {
    const noFamilyContext = global.createMockContext({
      auth: {
        isAuthenticated: true,
        user: {
          id: "user-id",
          email: "test@example.com",
          familyId: null,
        },
      },
    });

    await expect(
      getIncomeTrends(
        null,
        {
          dateFrom: "2024-01-01",
          dateTo: "2024-12-31",
        },
        noFamilyContext
      )
    ).rejects.toThrow();
  });

  it("should log start and end of operation", async () => {
    await getIncomeTrends(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(context.logger.info).toHaveBeenCalledWith("getIncomeTrends called", {
      familyId: expect.any(mongoose.Types.ObjectId),
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });

    expect(context.logger.info).toHaveBeenCalledWith("getIncomeTrends result", {
      count: 1,
    });
  });

  it("should handle database errors gracefully", async () => {
    const originalAggregate = FamilyIncome.aggregate;
    FamilyIncome.aggregate = jest
      .fn()
      .mockRejectedValue(new Error("Database error"));

    await expect(
      getIncomeTrends(
        null,
        {
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
        },
        context
      )
    ).rejects.toThrow();

    FamilyIncome.aggregate = originalAggregate;
  });
});
