const updateFamilyIncomes = require("../updateFamilyIncomes");
const { FamilyIncome } = require("../../../../database/schemas");

describe("updateFamilyIncomes mutation", () => {
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

  const createFamilyIncomeInDB = async (data = {}) => {
    const incomeData = createFamilyIncomeData(data);
    const income = new FamilyIncome(incomeData);
    return await income.save();
  };

  it("should update single family income successfully", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      amount: 2000,
      periodicity: "WEEKLY",
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(2000);
    expect(result[0].periodicity).toBe("WEEKLY");
    expect(result[0].contributorId.toString()).toBe(income.contributorId.toString()); // unchanged
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should update multiple family incomes successfully", async () => {
    const income1 = await createFamilyIncomeInDB({ amount: 1000 });
    const income2 = await createFamilyIncomeInDB({ amount: 2000 });
    const income3 = await createFamilyIncomeInDB({ amount: 3000 });
    const context = global.createMockContext();

    const updates = [
      { id: income1._id, amount: 1500 },
      { id: income2._id, periodicity: "DAILY" },
      { id: income3._id, amount: 3500, note: "Updated note" },
    ];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toHaveLength(3);
    
    const updatedIncome1 = result.find(r => r._id.toString() === income1._id.toString());
    const updatedIncome2 = result.find(r => r._id.toString() === income2._id.toString());
    const updatedIncome3 = result.find(r => r._id.toString() === income3._id.toString());

    expect(updatedIncome1.amount).toBe(1500);
    expect(updatedIncome2.periodicity).toBe("DAILY");
    expect(updatedIncome3.amount).toBe(3500);
    expect(updatedIncome3.note).toBe("Updated note");

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should handle empty updates array", async () => {
    const context = global.createMockContext();

    const result = await updateFamilyIncomes(
      null,
      { updates: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should update all family income fields", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      contributorId: global.createMockId(),
      currencyId: global.createMockId(),
      typeId: global.createMockId(),
      amount: 5000,
      periodicity: "YEARLY",
      date: new Date("2024-12-25"),
      note: "Updated family income",
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].amount).toBe(5000);
    expect(result[0].periodicity).toBe("YEARLY");
    expect(result[0].date).toEqual(new Date("2024-12-25"));
    expect(result[0].note).toBe("Updated family income");
  });

  it("should update only specified fields", async () => {
    const originalData = {
      amount: 1000,
      periodicity: "MONTHLY",
      note: "Original note",
    };
    const income = await createFamilyIncomeInDB(originalData);
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      amount: 1500, // only update amount
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].amount).toBe(1500); // updated
    expect(result[0].periodicity).toBe("MONTHLY"); // unchanged
    expect(result[0].note).toBe("Original note"); // unchanged
  });

  it("should handle updates with all periodicities", async () => {
    const incomes = await Promise.all([
      createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
      createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
      createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
      createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
      createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
    ]);

    const updates = [
      { id: incomes[0]._id, periodicity: "DAILY" },
      { id: incomes[1]._id, periodicity: "WEEKLY" },
      { id: incomes[2]._id, periodicity: "MONTHLY" },
      { id: incomes[3]._id, periodicity: "YEARLY" },
      { id: incomes[4]._id, periodicity: "ONE_TIME" },
    ];

    const context = global.createMockContext();

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toHaveLength(5);
    const periodicities = result.map(r => r.periodicity).sort();
    expect(periodicities).toEqual(["DAILY", "MONTHLY", "ONE_TIME", "WEEKLY", "YEARLY"]);
  });

  it("should handle decimal amounts", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      amount: 1234.56,
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].amount).toBe(1234.56);
  });

  it("should handle special characters in notes", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      note: "Salaire mensuel - très important! 💰€",
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].note).toBe("Salaire mensuel - très important! 💰€");
  });

  it("should handle large batch updates", async () => {
    const incomes = [];
    for (let i = 1; i <= 20; i++) {
      incomes.push(await createFamilyIncomeInDB({ amount: i * 100 }));
    }

    const updates = incomes.map(income => ({
      id: income._id,
      amount: income.amount * 2,
    }));

    const context = global.createMockContext();

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toHaveLength(20);
    expect(result.find(r => r.amount === 200)).toBeTruthy(); // 100 * 2
    expect(result.find(r => r.amount === 4000)).toBeTruthy(); // 2000 * 2
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should handle non-existent family income IDs gracefully", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [{
      id: nonExistentId,
      amount: 1000,
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingIncome = await createFamilyIncomeInDB({ amount: 1000 });
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      { id: existingIncome._id, amount: 2000 },
      { id: nonExistentId, amount: 3000 },
    ];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(2000);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated FamilyIncome records"
    );
  });

  it("should handle database errors gracefully", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    // Mock FamilyIncome.bulkWrite to throw an error
    const originalBulkWrite = FamilyIncome.bulkWrite;
    FamilyIncome.bulkWrite = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    const updates = [{
      id: income._id,
      amount: 2000,
    }];

    await expect(updateFamilyIncomes(
      null,
      { updates },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.bulkWrite = originalBulkWrite;
  });

  it("should persist changes in database", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      amount: 2500,
      note: "Updated note",
    }];

    await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    // Verify changes were persisted
    const updatedIncome = await FamilyIncome.findById(income._id);
    expect(updatedIncome.amount).toBe(2500);
    expect(updatedIncome.note).toBe("Updated note");
  });

  it("should handle negative amounts (MongoDB validation may not apply in bulkWrite)", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      amount: -100,
    }];

    // Note: MongoDB bulkWrite may not enforce schema validation
    // This test documents the current behavior
    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].amount).toBe(-100);
  });

  it("should handle invalid periodicity (MongoDB validation may not apply in bulkWrite)", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      periodicity: "INVALID_PERIOD",
    }];

    // Note: MongoDB bulkWrite may not enforce enum validation
    // This test documents the current behavior
    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].periodicity).toBe("INVALID_PERIOD");
  });

  it("should handle date updates correctly", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();
    const newDate = new Date("2025-06-15T10:30:00Z");

    const updates = [{
      id: income._id,
      date: newDate,
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].date).toEqual(newDate);
  });

  it("should handle ObjectId string format", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const updates = [{
      id: income._id.toString(), // string format
      amount: 1500,
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].amount).toBe(1500);
  });

  it("should handle null note updates", async () => {
    const income = await createFamilyIncomeInDB({ note: "Original note" });
    const context = global.createMockContext();

    const updates = [{
      id: income._id,
      note: null,
    }];

    const result = await updateFamilyIncomes(
      null,
      { updates },
      context
    );

    expect(result[0].note).toBeNull();
  });
}); 