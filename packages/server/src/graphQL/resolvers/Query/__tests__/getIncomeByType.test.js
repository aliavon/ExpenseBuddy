const getIncomeByType = require("../getIncomeByType");
const { FamilyIncome, IncomeType } = require("../../../../database/schemas");
const mongoose = require("mongoose");

describe("getIncomeByType resolver", () => {
  let context;
  let familyId;
  let type1, type2, type3;

  beforeEach(async () => {
    await FamilyIncome.deleteMany({});
    await IncomeType.deleteMany({});

    context = global.createMockContext();
    familyId = new mongoose.Types.ObjectId(context.auth.user.familyId);

    // Create test income types
    type1 = await IncomeType.create({
      name: "Salary",
      familyId,
    });

    type2 = await IncomeType.create({
      name: "Freelance",
      familyId,
    });

    type3 = await IncomeType.create({
      name: "Bonus",
      familyId,
    });
  });

  it("should return income grouped by type with percentages", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 5000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 2000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 3000,
        date: new Date("2024-01-25"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(2);

    // Sorted by amount descending
    expect(result[0].type.name).toBe("Salary");
    expect(result[0].amount).toBe(8000);
    expect(result[0].count).toBe(2);
    expect(result[0].percentage).toBe(80);

    expect(result[1].type.name).toBe("Freelance");
    expect(result[1].amount).toBe(2000);
    expect(result[1].count).toBe(1);
    expect(result[1].percentage).toBe(20);
  });

  it("should return empty array when no income data exists", async () => {
    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toEqual([]);
  });

  it("should handle zero total (all amounts are 0)", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 0,
        date: new Date("2024-01-15"),
        periodicity: "ONE_TIME",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 0,
        date: new Date("2024-01-20"),
        periodicity: "ONE_TIME",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(0);
    expect(result[0].percentage).toBe(0); // Should be 0 when total is 0
    expect(result[1].amount).toBe(0);
    expect(result[1].percentage).toBe(0);
  });

  it("should include all types when they exist", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 5000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.type.name).sort()).toEqual([
      "Freelance",
      "Salary",
    ]);
  });

  it("should filter by date range", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000,
        date: new Date("2023-12-15"), // Before range
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 2000,
        date: new Date("2024-01-15"), // In range
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type3._id,
        amount: 3000,
        date: new Date("2024-02-15"), // After range
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].type.name).toBe("Freelance");
    expect(result[0].amount).toBe(2000);
  });

  it("should only include data from user's family", async () => {
    const otherFamilyId = new mongoose.Types.ObjectId();

    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
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

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(1000);
  });

  it("should calculate correct percentages", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 6000,
        date: new Date("2024-01-10"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 3000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type3._id,
        amount: 1000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].percentage).toBe(60);
    expect(result[1].percentage).toBe(30);
    expect(result[2].percentage).toBe(10);
  });

  it("should handle zero total gracefully", async () => {
    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toEqual([]);
  });

  it("should aggregate multiple incomes of same type", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000,
        date: new Date("2024-01-05"),
        periodicity: "WEEKLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 500,
        date: new Date("2024-01-25"),
        periodicity: "ONE_TIME",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].type.name).toBe("Salary");
    expect(result[0].amount).toBe(3500);
    expect(result[0].count).toBe(3);
  });

  it("should sort results by amount descending", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-10"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 5000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type3._id,
        amount: 3000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(5000);
    expect(result[1].amount).toBe(3000);
    expect(result[2].amount).toBe(2000);
  });

  it("should handle deleted income type gracefully", async () => {
    const deletedTypeId = new mongoose.Types.ObjectId();

    await FamilyIncome.create([
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: deletedTypeId,
        amount: 2000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    // Should only return the valid type
    expect(result).toHaveLength(1);
    expect(result[0].type.name).toBe("Salary");
    expect(context.logger.warn).toHaveBeenCalledWith(
      { typeId: deletedTypeId },
      "IncomeType not found"
    );
  });

  it("should require authentication", async () => {
    const unauthContext = global.createMockContext({
      auth: null,
    });

    await expect(
      getIncomeByType(
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
      getIncomeByType(
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
    await getIncomeByType(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(context.logger.info).toHaveBeenCalledWith("getIncomeByType called", {
      familyId: expect.any(mongoose.Types.ObjectId),
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    });

    expect(context.logger.info).toHaveBeenCalledWith("getIncomeByType result", {
      count: 0,
    });
  });
});
