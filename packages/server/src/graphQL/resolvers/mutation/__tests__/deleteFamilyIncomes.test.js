const deleteFamilyIncomes = require("../deleteFamilyIncomes");
const { FamilyIncome } = require("../../../../database/schemas");

describe("deleteFamilyIncomes mutation", () => {
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

  it("should delete single family income successfully", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids: [income._id] },
      context
    );

    expect(result).toEqual([income._id]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify family income was actually deleted
    const deletedIncome = await FamilyIncome.findById(income._id);
    expect(deletedIncome).toBeNull();
  });

  it("should delete multiple family incomes successfully", async () => {
    const income1 = await createFamilyIncomeInDB({ amount: 1000 });
    const income2 = await createFamilyIncomeInDB({ amount: 2000 });
    const income3 = await createFamilyIncomeInDB({ amount: 3000 });
    const context = global.createMockContext();

    const ids = [income1._id, income2._id, income3._id];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify all family incomes were actually deleted
    const remainingIncomes = await FamilyIncome.find({ _id: { $in: ids } });
    expect(remainingIncomes).toHaveLength(0);
  });

  it("should handle empty ids array", async () => {
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully deleted FamilyIncome records"
    );
  });

  it("should handle non-existent family income IDs gracefully", async () => {
    const nonExistentId1 = global.createMockId();
    const nonExistentId2 = global.createMockId();
    const context = global.createMockContext();

    const ids = [nonExistentId1, nonExistentId2];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully deleted FamilyIncome records"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingIncome1 = await createFamilyIncomeInDB({ amount: 1000 });
    const existingIncome2 = await createFamilyIncomeInDB({ amount: 2000 });
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const ids = [existingIncome1._id, nonExistentId, existingIncome2._id];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify existing family incomes were deleted
    const deletedIncome1 = await FamilyIncome.findById(existingIncome1._id);
    const deletedIncome2 = await FamilyIncome.findById(existingIncome2._id);
    expect(deletedIncome1).toBeNull();
    expect(deletedIncome2).toBeNull();
  });

  it("should preserve order of IDs in result", async () => {
    const income1 = await createFamilyIncomeInDB();
    const income2 = await createFamilyIncomeInDB();
    const income3 = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const ids = [income3._id, income1._id, income2._id];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual([income3._id, income1._id, income2._id]);
  });

  it("should handle large batch deletion", async () => {
    const incomes = [];
    for (let i = 1; i <= 50; i++) {
      incomes.push(await createFamilyIncomeInDB({ amount: i * 100 }));
    }

    const ids = incomes.map(income => income._id);
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 50 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify all family incomes were deleted
    const remainingIncomes = await FamilyIncome.find({ _id: { $in: ids } });
    expect(remainingIncomes).toHaveLength(0);
  });

  it("should handle duplicate IDs in input", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    const ids = [income._id, income._id, income._id];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify family income was deleted (only once, despite multiple IDs)
    const deletedIncome = await FamilyIncome.findById(income._id);
    expect(deletedIncome).toBeNull();
  });

  it("should not affect other family incomes", async () => {
    const incomeToDelete = await createFamilyIncomeInDB({ amount: 1000 });
    const incomeToKeep1 = await createFamilyIncomeInDB({ amount: 2000 });
    const incomeToKeep2 = await createFamilyIncomeInDB({ amount: 3000 });
    const context = global.createMockContext();

    await deleteFamilyIncomes(
      null,
      { ids: [incomeToDelete._id] },
      context
    );

    // Verify only the targeted family income was deleted
    const deletedIncome = await FamilyIncome.findById(incomeToDelete._id);
    const keptIncome1 = await FamilyIncome.findById(incomeToKeep1._id);
    const keptIncome2 = await FamilyIncome.findById(incomeToKeep2._id);

    expect(deletedIncome).toBeNull();
    expect(keptIncome1).not.toBeNull();
    expect(keptIncome2).not.toBeNull();
    expect(keptIncome1.amount).toBe(2000);
    expect(keptIncome2.amount).toBe(3000);
  });

  it("should handle deletion of family incomes with different data types", async () => {
    const incomes = [
      await createFamilyIncomeInDB({ 
        amount: 1000.50, 
        periodicity: "DAILY",
        note: "Test income 1" 
      }),
      await createFamilyIncomeInDB({ 
        amount: 2000, 
        periodicity: "WEEKLY",
        note: "" 
      }),
      await createFamilyIncomeInDB({ 
        amount: 3000.99, 
        periodicity: "YEARLY",
        date: new Date("2024-12-25") 
      }),
    ];

    const ids = incomes.map(income => income._id);
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of their data
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle database errors gracefully", async () => {
    const income = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    // Mock FamilyIncome.deleteMany to throw an error
    const originalDeleteMany = FamilyIncome.deleteMany;
    FamilyIncome.deleteMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteFamilyIncomes(
      null,
      { ids: [income._id] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.deleteMany = originalDeleteMany;
  });

  it("should handle very large ID arrays", async () => {
    // Create a large array of IDs (some existing, some not)
    const existingIncomes = [];
    for (let i = 0; i < 10; i++) {
      existingIncomes.push(await createFamilyIncomeInDB({ amount: (i + 1) * 100 }));
    }

    const ids = [];
    // Add existing IDs
    existingIncomes.forEach(income => ids.push(income._id));
    // Add many non-existing IDs
    for (let i = 0; i < 100; i++) {
      ids.push(global.createMockId());
    }

    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(result).toHaveLength(110);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 110 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify existing family incomes were deleted
    for (const income of existingIncomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle ObjectId strings and ObjectId objects", async () => {
    const income1 = await createFamilyIncomeInDB();
    const income2 = await createFamilyIncomeInDB();
    const context = global.createMockContext();

    // Mix string and ObjectId formats
    const ids = [
      income1._id.toString(), // string format
      income2._id, // ObjectId format
    ];

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toHaveLength(2);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully deleted FamilyIncome records"
    );

    // Verify both were deleted
    const deletedIncome1 = await FamilyIncome.findById(income1._id);
    const deletedIncome2 = await FamilyIncome.findById(income2._id);
    expect(deletedIncome1).toBeNull();
    expect(deletedIncome2).toBeNull();
  });

  it("should return original IDs even after successful deletion", async () => {
    const income = await createFamilyIncomeInDB();
    const originalId = income._id;
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids: [originalId] },
      context
    );

    expect(result).toEqual([originalId]);
    expect(result[0]).toBe(originalId); // Same reference
  });

  it("should handle deletion of family incomes with different periodicities", async () => {
    const incomes = [
      await createFamilyIncomeInDB({ periodicity: "DAILY" }),
      await createFamilyIncomeInDB({ periodicity: "WEEKLY" }),
      await createFamilyIncomeInDB({ periodicity: "MONTHLY" }),
      await createFamilyIncomeInDB({ periodicity: "YEARLY" }),
      await createFamilyIncomeInDB({ periodicity: "ONE_TIME" }),
    ];

    const ids = incomes.map(income => income._id);
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of periodicity
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle deletion of family incomes with different contributors", async () => {
    const contributor1 = global.createMockId();
    const contributor2 = global.createMockId();
    const contributor3 = global.createMockId();

    const incomes = [
      await createFamilyIncomeInDB({ contributorId: contributor1 }),
      await createFamilyIncomeInDB({ contributorId: contributor2 }),
      await createFamilyIncomeInDB({ contributorId: contributor3 }),
    ];

    const ids = incomes.map(income => income._id);
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of contributor
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle deletion of family incomes with special characters in notes", async () => {
    const income = await createFamilyIncomeInDB({
      note: "Salaire mensuel - très important! 💰€",
    });
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(
      null,
      { ids: [income._id] },
      context
    );

    expect(result).toEqual([income._id]);

    // Verify deletion worked despite special characters
    const deletedIncome = await FamilyIncome.findById(income._id);
    expect(deletedIncome).toBeNull();
  });
}); 