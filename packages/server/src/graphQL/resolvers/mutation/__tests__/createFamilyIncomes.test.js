const createFamilyIncomes = require("../createFamilyIncomes");
const { FamilyIncome } = require("../../../../database/schemas");

describe("createFamilyIncomes mutation", () => {
  beforeEach(async () => {
    await FamilyIncome.deleteMany({});
  });

  const createFamilyIncomeData = (overrides = {}) => ({
    contributorId: global.createMockId(),
    currencyId: global.createMockId(),
    typeId: global.createMockId(),
    amount: 1000,
    periodicity: "MONTHLY",
    date: new Date("2024-01-15"),
    ...overrides,
  });

  it("should create single family income successfully", async () => {
    const incomeData = createFamilyIncomeData();
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [incomeData] },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].contributorId.toString()).toBe(incomeData.contributorId.toString());
    expect(result[0].currencyId.toString()).toBe(incomeData.currencyId.toString());
    expect(result[0].typeId.toString()).toBe(incomeData.typeId.toString());
    expect(result[0].amount).toBe(1000);
    expect(result[0].periodicity).toBe("MONTHLY");
    expect(result[0].date).toEqual(new Date("2024-01-15"));
    expect(result[0]).toHaveProperty("_id");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully created FamilyIncome records"
    );
  });

  it("should create multiple family incomes successfully", async () => {
    const incomes = [
      createFamilyIncomeData({ amount: 1000, periodicity: "MONTHLY" }),
      createFamilyIncomeData({ amount: 2000, periodicity: "WEEKLY" }),
      createFamilyIncomeData({ amount: 3000, periodicity: "DAILY" }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(1000);
    expect(result[0].periodicity).toBe("MONTHLY");
    expect(result[1].amount).toBe(2000);
    expect(result[1].periodicity).toBe("WEEKLY");
    expect(result[2].amount).toBe(3000);
    expect(result[2].periodicity).toBe("DAILY");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully created FamilyIncome records"
    );
  });

  it("should handle empty family incomes array", async () => {
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully created FamilyIncome records"
    );
  });

  it("should create family incomes with all periodicities", async () => {
    const incomes = [
      createFamilyIncomeData({ periodicity: "DAILY" }),
      createFamilyIncomeData({ periodicity: "WEEKLY" }),
      createFamilyIncomeData({ periodicity: "MONTHLY" }),
      createFamilyIncomeData({ periodicity: "YEARLY" }),
      createFamilyIncomeData({ periodicity: "ONE_TIME" }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(5);
    expect(result.map(r => r.periodicity)).toEqual([
      "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONE_TIME"
    ]);
  });

  it("should create family incomes with different amounts", async () => {
    const incomes = [
      createFamilyIncomeData({ amount: 0.01 }),
      createFamilyIncomeData({ amount: 100.50 }),
      createFamilyIncomeData({ amount: 999999.99 }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(0.01);
    expect(result[1].amount).toBe(100.50);
    expect(result[2].amount).toBe(999999.99);
  });

  it("should create family incomes with different dates", async () => {
    const incomes = [
      createFamilyIncomeData({ date: new Date("2024-01-01") }),
      createFamilyIncomeData({ date: new Date("2024-06-15") }),
      createFamilyIncomeData({ date: new Date("2024-12-31") }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date("2024-01-01"));
    expect(result[1].date).toEqual(new Date("2024-06-15"));
    expect(result[2].date).toEqual(new Date("2024-12-31"));
  });

  it("should create family incomes with different contributors", async () => {
    const contributor1 = global.createMockId();
    const contributor2 = global.createMockId();
    const contributor3 = global.createMockId();

    const incomes = [
      createFamilyIncomeData({ contributorId: contributor1 }),
      createFamilyIncomeData({ contributorId: contributor2 }),
      createFamilyIncomeData({ contributorId: contributor3 }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].contributorId.toString()).toBe(contributor1.toString());
    expect(result[1].contributorId.toString()).toBe(contributor2.toString());
    expect(result[2].contributorId.toString()).toBe(contributor3.toString());
  });

  it("should create family incomes with notes", async () => {
    const incomes = [
      createFamilyIncomeData({ note: "Salary payment" }),
      createFamilyIncomeData({ note: "Bonus payment" }),
      createFamilyIncomeData({ note: "" }), // empty note
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].note).toBe("Salary payment");
    expect(result[1].note).toBe("Bonus payment");
    expect(result[2].note).toBe("");
  });

  it("should create family incomes with special characters in notes", async () => {
    const incomeData = createFamilyIncomeData({
      note: "Paiement de salaire - très important! 💰",
    });
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [incomeData] },
      context
    );

    expect(result[0].note).toBe("Paiement de salaire - très important! 💰");
  });

  it("should handle large batch creation", async () => {
    const incomes = [];
    for (let i = 1; i <= 50; i++) {
      incomes.push(createFamilyIncomeData({
        amount: i * 100,
        date: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}`),
      }));
    }
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result).toHaveLength(50);
    expect(result[0].amount).toBe(100);
    expect(result[49].amount).toBe(5000);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 50 },
      "Successfully created FamilyIncome records"
    );
  });

  it("should preserve insertion order", async () => {
    const incomes = [
      createFamilyIncomeData({ amount: 1000 }),
      createFamilyIncomeData({ amount: 2000 }),
      createFamilyIncomeData({ amount: 3000 }),
    ];
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: incomes },
      context
    );

    expect(result[0].amount).toBe(1000);
    expect(result[1].amount).toBe(2000);
    expect(result[2].amount).toBe(3000);
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    
    // Mock FamilyIncome.insertMany to throw an error
    const originalInsertMany = FamilyIncome.insertMany;
    FamilyIncome.insertMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [createFamilyIncomeData()] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.insertMany = originalInsertMany;
  });

  it("should handle validation errors for missing required fields", async () => {
    const context = global.createMockContext();

    // Test missing contributorId
    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [{ 
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        amount: 1000,
        date: new Date(),
      }] },
      context
    )).rejects.toThrow();

    // Test missing amount
    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [{ 
        contributorId: global.createMockId(),
        currencyId: global.createMockId(),
        typeId: global.createMockId(),
        date: new Date(),
      }] },
      context
    )).rejects.toThrow();
  });

  it("should handle validation errors for negative amounts", async () => {
    const context = global.createMockContext();

    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [createFamilyIncomeData({ amount: -100 })] },
      context
    )).rejects.toThrow();
  });

  it("should handle validation errors for invalid periodicity", async () => {
    const context = global.createMockContext();

    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [createFamilyIncomeData({ periodicity: "INVALID" })] },
      context
    )).rejects.toThrow();
  });

  it("should persist family incomes in database", async () => {
    const incomeData = createFamilyIncomeData();
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [incomeData] },
      context
    );

    // Verify family income was actually saved to database
    const savedIncome = await FamilyIncome.findById(result[0]._id);
    expect(savedIncome).not.toBeNull();
    expect(savedIncome.amount).toBe(1000);
    expect(savedIncome.periodicity).toBe("MONTHLY");
  });

  it("should handle default periodicity", async () => {
    const incomeData = createFamilyIncomeData();
    delete incomeData.periodicity; // Remove periodicity to test default
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [incomeData] },
      context
    );

    expect(result[0].periodicity).toBe("ONE_TIME"); // default value
  });

  it("should handle default note", async () => {
    const incomeData = createFamilyIncomeData();
    delete incomeData.note; // Remove note to test default
    const context = global.createMockContext();

    const result = await createFamilyIncomes(
      null,
      { familyIncomes: [incomeData] },
      context
    );

    expect(result[0].note).toBe(""); // default value
  });

  it("should handle mixed valid and invalid data gracefully", async () => {
    const context = global.createMockContext();

    // This should fail for the entire batch due to one invalid record
    await expect(createFamilyIncomes(
      null,
      { familyIncomes: [
        createFamilyIncomeData({ amount: 1000 }), // valid
        createFamilyIncomeData({ amount: -100 }), // invalid (negative)
      ] },
      context
    )).rejects.toThrow();

    // Verify no records were created
    const count = await FamilyIncome.countDocuments();
    expect(count).toBe(0);
  });
}); 