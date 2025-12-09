const getIncomeStatistics = require("../getIncomeStatistics");
const {
  FamilyIncome,
  User,
  IncomeType,
} = require("../../../../database/schemas");
const mongoose = require("mongoose");

describe("getIncomeStatistics resolver", () => {
  let context;
  let familyId;
  let user1, user2, type1, type2;

  beforeEach(async () => {
    await FamilyIncome.deleteMany({});
    await User.deleteMany({});
    await IncomeType.deleteMany({});

    context = global.createMockContext();
    familyId = new mongoose.Types.ObjectId(context.auth.user.familyId);

    // Create test users
    user1 = await User.create({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      password: "hashedPassword123",
      familyId,
      roleInFamily: "OWNER",
    });

    user2 = await User.create({
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@example.com",
      password: "hashedPassword123",
      familyId,
      roleInFamily: "MEMBER",
    });

    // Create test income types
    type1 = await IncomeType.create({
      name: "Salary",
      familyId,
    });

    type2 = await IncomeType.create({
      name: "Freelance",
      familyId,
    });
  });

  it("should return comprehensive income statistics", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 5000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user2._id,
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 2000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 3000,
        date: new Date("2024-01-25"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.totalIncome).toBe(10000);
    expect(result.averageIncome).toBeCloseTo(3333.33, 2);
    expect(result.incomeCount).toBe(3);
    expect(result.topContributor).toBeTruthy();
    expect(result.topContributor.firstName).toBe("Alice");
    expect(result.topIncomeType).toBeTruthy();
    expect(result.topIncomeType.name).toBe("Salary");
  });

  it("should return zeros when no income data exists", async () => {
    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result).toEqual({
      totalIncome: 0,
      averageIncome: 0,
      incomeCount: 0,
      topContributor: null,
      topIncomeType: null,
    });
  });

  it("should identify correct top contributor", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user2._id,
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 5000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.topContributor.firstName).toBe("Bob");
  });

  it("should identify correct top income type", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user2._id,
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 5000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.topIncomeType.name).toBe("Freelance");
  });

  it("should filter by date range", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000,
        date: new Date("2023-12-15"), // Before range
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-15"), // In range
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 3000,
        date: new Date("2024-02-15"), // After range
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.totalIncome).toBe(2000);
    expect(result.incomeCount).toBe(1);
  });

  it("should only include data from user's family", async () => {
    const otherFamilyId = new mongoose.Types.ObjectId();

    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
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

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.totalIncome).toBe(1000);
    expect(result.incomeCount).toBe(1);
  });

  it("should handle multiple income types correctly", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 5000,
        date: new Date("2024-01-15"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user2._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 2000,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.totalIncome).toBe(7000);
    expect(result.incomeCount).toBe(2);
    expect(result.topIncomeType.name).toBe("Freelance");
  });

  it("should handle decimal amounts", async () => {
    await FamilyIncome.create([
      {
        familyId,
        contributorId: user1._id,
        currencyId: global.createMockId(),
        typeId: type1._id,
        amount: 1000.5,
        date: new Date("2024-01-10"),
        periodicity: "MONTHLY",
      },
      {
        familyId,
        contributorId: user2._id,
        currencyId: global.createMockId(),
        typeId: type2._id,
        amount: 2000.75,
        date: new Date("2024-01-20"),
        periodicity: "MONTHLY",
      },
    ]);

    const result = await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(result.totalIncome).toBe(3001.25);
    expect(result.averageIncome).toBeCloseTo(1500.625, 3);
    expect(result.incomeCount).toBe(2);
  });

  it("should require authentication", async () => {
    const unauthContext = global.createMockContext({
      auth: null,
    });

    await expect(
      getIncomeStatistics(
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
      getIncomeStatistics(
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
    await getIncomeStatistics(
      null,
      {
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
      context
    );

    expect(context.logger.info).toHaveBeenCalledWith(
      "getIncomeStatistics called",
      {
        familyId: expect.any(mongoose.Types.ObjectId),
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      }
    );

    expect(context.logger.info).toHaveBeenCalledWith(
      "getIncomeStatistics result",
      expect.objectContaining({
        totalIncome: expect.any(Number),
        averageIncome: expect.any(Number),
        incomeCount: expect.any(Number),
      })
    );
  });
});
