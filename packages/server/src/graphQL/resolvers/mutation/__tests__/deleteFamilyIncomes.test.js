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

  const createFamilyIncomeInDB = async (
    data = {},
    context = global.createMockContext()
  ) => {
    const incomeData = createFamilyIncomeData({
      familyId: context.auth.user.familyId,
      createdByUserId: context.auth.user.id,
      ...data,
    });
    const income = new FamilyIncome(incomeData);
    return await income.save();
  };

  it("should delete single family income successfully", async () => {
    const context = global.createMockContext();
    const income = await createFamilyIncomeInDB({}, context);

    const result = await deleteFamilyIncomes(
      null,
      { ids: [income._id] },
      context
    );

    expect(result).toEqual([income._id]);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 1,
        deletedCount: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );

    // Verify family income was actually deleted
    const deletedIncome = await FamilyIncome.findById(income._id);
    expect(deletedIncome).toBeNull();
  });

  it("should delete multiple family incomes successfully", async () => {
    const context = global.createMockContext();
    const income1 = await createFamilyIncomeInDB({ amount: 1000 }, context);
    const income2 = await createFamilyIncomeInDB({ amount: 2000 }, context);
    const income3 = await createFamilyIncomeInDB({ amount: 3000 }, context);

    const ids = [income1._id, income2._id, income3._id];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 3,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );

    // Verify all family incomes were actually deleted
    const remainingIncomes = await FamilyIncome.find({ _id: { $in: ids } });
    expect(remainingIncomes).toHaveLength(0);
  });

  it("should handle empty ids array", async () => {
    const context = global.createMockContext();

    const result = await deleteFamilyIncomes(null, { ids: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 0,
        deletedCount: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );
  });

  it("should handle non-existent family income IDs gracefully", async () => {
    const nonExistentId1 = global.createMockId();
    const nonExistentId2 = global.createMockId();
    const context = global.createMockContext();

    const ids = [nonExistentId1, nonExistentId2];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 2,
        deletedCount: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const context = global.createMockContext();
    const existingIncome1 = await createFamilyIncomeInDB(
      { amount: 1000 },
      context
    );
    const existingIncome2 = await createFamilyIncomeInDB(
      { amount: 2000 },
      context
    );
    const nonExistentId = global.createMockId();

    const ids = [existingIncome1._id, nonExistentId, existingIncome2._id];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
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
    const context = global.createMockContext();
    const income3 = await createFamilyIncomeInDB({}, context);

    const ids = [income3._id, income1._id, income2._id];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual([income3._id, income1._id, income2._id]);
  });

  it("should handle large batch deletion", async () => {
    const context = global.createMockContext();
    const incomes = [];
    for (let i = 1; i <= 50; i++) {
      incomes.push(await createFamilyIncomeInDB({ amount: i * 100 }, context));
    }

    const ids = incomes.map((income) => income._id);

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 50,
        deletedCount: 50,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );

    // Verify all family incomes were deleted
    const remainingIncomes = await FamilyIncome.find({ _id: { $in: ids } });
    expect(remainingIncomes).toHaveLength(0);
  });

  it("should handle duplicate IDs in input", async () => {
    const context = global.createMockContext();
    const income = await createFamilyIncomeInDB({}, context);

    const ids = [income._id, income._id, income._id];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );

    // Verify family income was deleted (only once, despite multiple IDs)
    const deletedIncome = await FamilyIncome.findById(income._id);
    expect(deletedIncome).toBeNull();
  });

  it("should not affect other family incomes", async () => {
    const context = global.createMockContext();
    const incomeToDelete = await createFamilyIncomeInDB(
      { amount: 1000 },
      context
    );
    const incomeToKeep1 = await createFamilyIncomeInDB(
      { amount: 2000 },
      context
    );
    const incomeToKeep2 = await createFamilyIncomeInDB(
      { amount: 3000 },
      context
    );

    await deleteFamilyIncomes(null, { ids: [incomeToDelete._id] }, context);

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
    const context = global.createMockContext();
    const incomes = [
      await createFamilyIncomeInDB(
        {
          amount: 1000.5,
          periodicity: "DAILY",
          note: "Test income 1",
        },
        context
      ),
      await createFamilyIncomeInDB(
        {
          amount: 2000,
          periodicity: "WEEKLY",
          note: "",
        },
        context
      ),
      await createFamilyIncomeInDB(
        {
          amount: 3000.99,
          periodicity: "YEARLY",
          date: new Date("2024-12-25"),
        },
        context
      ),
    ];

    const ids = incomes.map((income) => income._id);

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of their data
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    const income = await createFamilyIncomeInDB({}, context);

    // Mock FamilyIncome.deleteMany to throw an error
    const originalDeleteMany = FamilyIncome.deleteMany;
    FamilyIncome.deleteMany = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(
      deleteFamilyIncomes(null, { ids: [income._id] }, context)
    ).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.deleteMany = originalDeleteMany;
  });

  it("should handle very large ID arrays", async () => {
    // Create a large array of IDs (some existing, some not)
    const context = global.createMockContext();
    const existingIncomes = [];
    for (let i = 0; i < 10; i++) {
      existingIncomes.push(
        await createFamilyIncomeInDB({ amount: (i + 1) * 100 }, context)
      );
    }

    const ids = [];
    // Add existing IDs
    existingIncomes.forEach((income) => ids.push(income._id));
    // Add many non-existing IDs
    for (let i = 0; i < 100; i++) {
      ids.push(global.createMockId());
    }

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(result).toHaveLength(110);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 110,
        deletedCount: 10,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
    );

    // Verify existing family incomes were deleted
    for (const income of existingIncomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle ObjectId strings and ObjectId objects", async () => {
    const context = global.createMockContext();
    const income1 = await createFamilyIncomeInDB({}, context);
    const income2 = await createFamilyIncomeInDB({}, context);

    // Mix string and ObjectId formats
    const ids = [
      income1._id.toString(), // string format
      income2._id, // ObjectId format
    ];

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toHaveLength(2);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 2,
        deletedCount: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family income records"
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
    const context = global.createMockContext();
    const incomes = [
      await createFamilyIncomeInDB({ periodicity: "DAILY" }, context),
      await createFamilyIncomeInDB({ periodicity: "WEEKLY" }, context),
      await createFamilyIncomeInDB({ periodicity: "MONTHLY" }, context),
      await createFamilyIncomeInDB({ periodicity: "YEARLY" }, context),
      await createFamilyIncomeInDB({ periodicity: "ONE_TIME" }, context),
    ];

    const ids = incomes.map((income) => income._id);

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of periodicity
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle deletion of family incomes with different contributors", async () => {
    const context = global.createMockContext();
    const contributor1 = global.createMockId();
    const contributor2 = global.createMockId();
    const contributor3 = global.createMockId();

    const incomes = [
      await createFamilyIncomeInDB({ contributorId: contributor1 }, context),
      await createFamilyIncomeInDB({ contributorId: contributor2 }, context),
      await createFamilyIncomeInDB({ contributorId: contributor3 }, context),
    ];

    const ids = incomes.map((income) => income._id);

    const result = await deleteFamilyIncomes(null, { ids }, context);

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of contributor
    for (const income of incomes) {
      const deletedIncome = await FamilyIncome.findById(income._id);
      expect(deletedIncome).toBeNull();
    }
  });

  it("should handle deletion of family incomes with special characters in notes", async () => {
    const context = global.createMockContext();
    const income = await createFamilyIncomeInDB(
      {
        note: "Salaire mensuel - très important! 💰€",
      },
      context
    );

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
