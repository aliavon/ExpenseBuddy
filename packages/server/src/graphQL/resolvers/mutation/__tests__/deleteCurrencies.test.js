const deleteCurrencies = require("../deleteCurrencies");
const { Currency, FamilyIncome } = require("../../../../database/schemas");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("deleteCurrencies mutation", () => {
  beforeEach(async () => {
    await Currency.deleteMany({});
    await FamilyIncome.deleteMany({});
    currencyCounter = 0; // Reset counter for each test
  });

  let currencyCounter = 0;
  const createCurrencyData = (overrides = {}) => {
    currencyCounter++;
    return {
      name: `Currency ${currencyCounter}`,
      code: `CUR${currencyCounter}`,
      symbol: `$${currencyCounter}`,
      ...overrides,
    };
  };

  const createCurrencyInDB = async (data = {}) => {
    const currencyData = createCurrencyData(data);
    const currency = new Currency(currencyData);
    return await currency.save();
  };

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

  it("should delete single currency successfully", async () => {
    const currency = await createCurrencyInDB();
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    );

    expect(result).toEqual([currency._id]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully deleted currencies"
    );

    // Verify currency was actually deleted
    const deletedCurrency = await Currency.findById(currency._id);
    expect(deletedCurrency).toBeNull();
  });

  it("should delete multiple currencies successfully", async () => {
    const currency1 = await createCurrencyInDB({ code: "USD" });
    const currency2 = await createCurrencyInDB({ code: "EUR" });
    const currency3 = await createCurrencyInDB({ code: "GBP" });
    const context = global.createMockContext();

    const ids = [currency1._id, currency2._id, currency3._id];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted currencies"
    );

    // Verify all currencies were actually deleted
    const remainingCurrencies = await Currency.find({ _id: { $in: ids } });
    expect(remainingCurrencies).toHaveLength(0);
  });

  it("should handle empty ids array", async () => {
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully deleted currencies"
    );
  });

  it("should throw error when currency is used in FamilyIncome records", async () => {
    const currency = await createCurrencyInDB();
    
    // Create FamilyIncome record referencing this currency
    await createFamilyIncomeInDB({ currencyId: currency._id });
    
    const context = global.createMockContext();

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow(GraphQLError);

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow("One or more currencies are in use and cannot be deleted.");

    // Verify currency was not deleted
    const existingCurrency = await Currency.findById(currency._id);
    expect(existingCurrency).not.toBeNull();
  });

  it("should throw error with correct error code for currency in use", async () => {
    const currency = await createCurrencyInDB();
    await createFamilyIncomeInDB({ currencyId: currency._id });
    const context = global.createMockContext();

    try {
      await deleteCurrencies(null, { ids: [currency._id] }, context);
      fail("Expected GraphQLError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions.code).toBe(ERROR_CODES.CURRENCY_IN_USE);
    }
  });

  it("should delete currencies when no FamilyIncome references exist", async () => {
    const currency = await createCurrencyInDB();
    
    // Create FamilyIncome record with different currencyId
    const otherCurrencyId = global.createMockId();
    await createFamilyIncomeInDB({ currencyId: otherCurrencyId });
    
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    );

    expect(result).toEqual([currency._id]);

    // Verify currency was deleted
    const deletedCurrency = await Currency.findById(currency._id);
    expect(deletedCurrency).toBeNull();

    // Verify other FamilyIncome record still exists
    const remainingIncome = await FamilyIncome.findOne({ currencyId: otherCurrencyId });
    expect(remainingIncome).not.toBeNull();
  });

  it("should handle multiple FamilyIncome references to same currency", async () => {
    const currency = await createCurrencyInDB();
    
    // Create multiple FamilyIncome records referencing this currency
    await createFamilyIncomeInDB({ currencyId: currency._id, amount: 1000 });
    await createFamilyIncomeInDB({ currencyId: currency._id, amount: 2000 });
    await createFamilyIncomeInDB({ currencyId: currency._id, amount: 3000 });
    
    const context = global.createMockContext();

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow("One or more currencies are in use and cannot be deleted.");

    // Verify currency was not deleted
    const existingCurrency = await Currency.findById(currency._id);
    expect(existingCurrency).not.toBeNull();
  });

  it("should handle mixed currencies - some in use, some not", async () => {
    const usedCurrency = await createCurrencyInDB({ code: "USD" });
    const unusedCurrency = await createCurrencyInDB({ code: "EUR" });
    
    // Create FamilyIncome record referencing only one currency
    await createFamilyIncomeInDB({ currencyId: usedCurrency._id });
    
    const context = global.createMockContext();

    // Should fail because one currency is in use
    await expect(deleteCurrencies(
      null,
      { ids: [usedCurrency._id, unusedCurrency._id] },
      context
    )).rejects.toThrow("One or more currencies are in use and cannot be deleted.");

    // Verify both currencies still exist
    const existingUsedCurrency = await Currency.findById(usedCurrency._id);
    const existingUnusedCurrency = await Currency.findById(unusedCurrency._id);
    expect(existingUsedCurrency).not.toBeNull();
    expect(existingUnusedCurrency).not.toBeNull();
  });

  it("should handle non-existent currency IDs gracefully", async () => {
    const nonExistentId1 = global.createMockId();
    const nonExistentId2 = global.createMockId();
    const context = global.createMockContext();

    const ids = [nonExistentId1, nonExistentId2];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully deleted currencies"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingCurrency1 = await createCurrencyInDB({ code: "USD" });
    const existingCurrency2 = await createCurrencyInDB({ code: "EUR" });
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const ids = [existingCurrency1._id, nonExistentId, existingCurrency2._id];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted currencies"
    );

    // Verify existing currencies were deleted
    const deletedCurrency1 = await Currency.findById(existingCurrency1._id);
    const deletedCurrency2 = await Currency.findById(existingCurrency2._id);
    expect(deletedCurrency1).toBeNull();
    expect(deletedCurrency2).toBeNull();
  });

  it("should preserve order of IDs in result", async () => {
    const currency1 = await createCurrencyInDB({ code: "USD" });
    const currency2 = await createCurrencyInDB({ code: "EUR" });
    const currency3 = await createCurrencyInDB({ code: "GBP" });
    const context = global.createMockContext();

    const ids = [currency3._id, currency1._id, currency2._id];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual([currency3._id, currency1._id, currency2._id]);
  });

  it("should handle large batch deletion", async () => {
    const currencies = [];
    for (let i = 1; i <= 50; i++) {
      currencies.push(await createCurrencyInDB({ 
        code: `CUR${i}`,
        name: `Currency ${i}`,
      }));
    }

    const ids = currencies.map(currency => currency._id);
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 50 },
      "Successfully deleted currencies"
    );

    // Verify all currencies were deleted
    const remainingCurrencies = await Currency.find({ _id: { $in: ids } });
    expect(remainingCurrencies).toHaveLength(0);
  });

  it("should handle duplicate IDs in input", async () => {
    const currency = await createCurrencyInDB();
    const context = global.createMockContext();

    const ids = [currency._id, currency._id, currency._id];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully deleted currencies"
    );

    // Verify currency was deleted (only once, despite multiple IDs)
    const deletedCurrency = await Currency.findById(currency._id);
    expect(deletedCurrency).toBeNull();
  });

  it("should not affect other currencies during deletion", async () => {
    const currencyToDelete = await createCurrencyInDB({ code: "DEL" });
    const currencyToKeep1 = await createCurrencyInDB({ code: "KEEP1" });
    const currencyToKeep2 = await createCurrencyInDB({ code: "KEEP2" });
    const context = global.createMockContext();

    await deleteCurrencies(
      null,
      { ids: [currencyToDelete._id] },
      context
    );

    // Verify only the targeted currency was deleted
    const deletedCurrency = await Currency.findById(currencyToDelete._id);
    const keptCurrency1 = await Currency.findById(currencyToKeep1._id);
    const keptCurrency2 = await Currency.findById(currencyToKeep2._id);

    expect(deletedCurrency).toBeNull();
    expect(keptCurrency1).not.toBeNull();
    expect(keptCurrency2).not.toBeNull();
    expect(keptCurrency1.code).toBe("KEEP1");
    expect(keptCurrency2.code).toBe("KEEP2");
  });

  it("should handle database errors gracefully during FamilyIncome count", async () => {
    const currency = await createCurrencyInDB();
    const context = global.createMockContext();

    // Mock FamilyIncome.countDocuments to throw an error
    const originalCountDocuments = FamilyIncome.countDocuments;
    FamilyIncome.countDocuments = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    FamilyIncome.countDocuments = originalCountDocuments;
  });

  it("should handle database errors gracefully during currency deletion", async () => {
    const currency = await createCurrencyInDB();
    const context = global.createMockContext();

    // Mock Currency.deleteMany to throw an error
    const originalDeleteMany = Currency.deleteMany;
    Currency.deleteMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    Currency.deleteMany = originalDeleteMany;
  });

  it("should check FamilyIncome usage before deletion", async () => {
    const currency = await createCurrencyInDB();
    const context = global.createMockContext();

    // Mock Currency.deleteMany to verify it's not called when currency is in use
    const originalDeleteMany = Currency.deleteMany;
    const mockDeleteMany = jest.fn();
    Currency.deleteMany = mockDeleteMany;

    // Create FamilyIncome record using the currency
    await createFamilyIncomeInDB({ currencyId: currency._id });

    await expect(deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    )).rejects.toThrow("One or more currencies are in use and cannot be deleted.");

    // Verify deleteMany was not called
    expect(mockDeleteMany).not.toHaveBeenCalled();

    // Restore original method
    Currency.deleteMany = originalDeleteMany;
  });

  it("should handle ObjectId strings and ObjectId objects", async () => {
    const currency1 = await createCurrencyInDB({ code: "USD" });
    const currency2 = await createCurrencyInDB({ code: "EUR" });
    const context = global.createMockContext();

    // Mix string and ObjectId formats
    const ids = [
      currency1._id.toString(), // string format
      currency2._id, // ObjectId format
    ];

    const result = await deleteCurrencies(
      null,
      { ids },
      context
    );

    expect(result).toHaveLength(2);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully deleted currencies"
    );

    // Verify both were deleted
    const deletedCurrency1 = await Currency.findById(currency1._id);
    const deletedCurrency2 = await Currency.findById(currency2._id);
    expect(deletedCurrency1).toBeNull();
    expect(deletedCurrency2).toBeNull();
  });

  it("should return original IDs even after successful deletion", async () => {
    const currency = await createCurrencyInDB();
    const originalId = currency._id;
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [originalId] },
      context
    );

    expect(result).toEqual([originalId]);
    expect(result[0]).toBe(originalId); // Same reference
  });

  it("should handle currencies with special characters", async () => {
    const currency = await createCurrencyInDB({
      name: "Yen Japonais",
      code: "JPY",
      symbol: "¥",
    });
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    );

    expect(result).toEqual([currency._id]);

    // Verify deletion worked despite special characters
    const deletedCurrency = await Currency.findById(currency._id);
    expect(deletedCurrency).toBeNull();
  });

  it("should handle currencies with emoji", async () => {
    const currency = await createCurrencyInDB({
      name: "Fun Coin 🎉",
      symbol: "🪙",
    });
    const context = global.createMockContext();

    const result = await deleteCurrencies(
      null,
      { ids: [currency._id] },
      context
    );

    expect(result).toEqual([currency._id]);

    // Verify deletion worked despite emoji
    const deletedCurrency = await Currency.findById(currency._id);
    expect(deletedCurrency).toBeNull();
  });
}); 