const updateCurrencies = require("../updateCurrencies");
const { Currency } = require("../../../../database/schemas");

describe("updateCurrencies mutation", () => {
  beforeEach(async () => {
    await Currency.deleteMany({});
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

  const createCurrencyInDB = async (
    data = {},
    context = global.createMockContext()
  ) => {
    const currencyData = createCurrencyData({
      familyId: context.auth.user.familyId,
      createdByUserId: context.auth.user.id,
      ...data,
    });
    const currency = new Currency(currencyData);
    return await currency.save();
  };

  it("should update single currency successfully", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "Euro",
        code: "EUR",
        symbol: "€",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Euro");
    expect(result[0].code).toBe("EUR");
    expect(result[0].symbol).toBe("€");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1, modifiedCount: 1, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should update multiple currencies successfully", async () => {
    const context = global.createMockContext();
    const currency1 = await createCurrencyInDB({ code: "USD" }, context);
    const currency2 = await createCurrencyInDB({ code: "EUR" }, context);
    const currency3 = await createCurrencyInDB({ code: "GBP" }, context);

    const updates = [
      { id: currency1._id, name: "United States Dollar" },
      { id: currency2._id, symbol: "€€" },
      { id: currency3._id, name: "British Pound Sterling", symbol: "£" },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result).toHaveLength(3);

    const updatedCurrency1 = result.find(
      (r) => r._id.toString() === currency1._id.toString()
    );
    const updatedCurrency2 = result.find(
      (r) => r._id.toString() === currency2._id.toString()
    );
    const updatedCurrency3 = result.find(
      (r) => r._id.toString() === currency3._id.toString()
    );

    expect(updatedCurrency1.name).toBe("United States Dollar");
    expect(updatedCurrency2.symbol).toBe("€€");
    expect(updatedCurrency3.name).toBe("British Pound Sterling");
    expect(updatedCurrency3.symbol).toBe("£");

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3, modifiedCount: 3, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should handle empty updates array", async () => {
    const context = global.createMockContext();

    const result = await updateCurrencies(null, { updates: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0, modifiedCount: 0, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should update only specified fields", async () => {
    const originalData = {
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    };
    const currency = await createCurrencyInDB(originalData);
    const context = global.createMockContext();

    const updates = [
      {
        id: currency._id,
        name: "United States Dollar", // only update name
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("United States Dollar"); // updated
    expect(result[0].code).toBe("USD"); // unchanged
    expect(result[0].symbol).toBe("$"); // unchanged
  });

  it("should handle special characters in currency data", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "Yen Japonais",
        code: "JPY",
        symbol: "¥",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("Yen Japonais");
    expect(result[0].code).toBe("JPY");
    expect(result[0].symbol).toBe("¥");
  });

  it("should handle unicode symbols", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "Bitcoin",
        code: "BTC",
        symbol: "₿",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("Bitcoin");
    expect(result[0].code).toBe("BTC");
    expect(result[0].symbol).toBe("₿");
  });

  it("should handle emoji in currency data", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "Fun Coin 🎉",
        code: "FUN",
        symbol: "🪙",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("Fun Coin 🎉");
    expect(result[0].code).toBe("FUN");
    expect(result[0].symbol).toBe("🪙");
  });

  it("should handle large batch updates", async () => {
    const currencies = [];
    for (let i = 1; i <= 20; i++) {
      currencies.push(
        await createCurrencyInDB({
          code: `CUR${i}`,
          name: `Currency ${i}`,
        })
      );
    }

    const updates = currencies.map((currency, index) => ({
      id: currency._id,
      name: `Updated Currency ${index + 1}`,
    }));

    const context = global.createMockContext();

    const result = await updateCurrencies(null, { updates }, context);

    expect(result).toHaveLength(20);
    expect(result[0].name).toBe("Updated Currency 1");
    expect(result[19].name).toBe("Updated Currency 20");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20, modifiedCount: 20, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should handle non-existent currency IDs gracefully", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      {
        id: nonExistentId,
        name: "Non-existent Currency",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0, modifiedCount: 0, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const context = global.createMockContext();
    const existingCurrency = await createCurrencyInDB(
      { name: "Original" },
      context
    );
    const nonExistentId = global.createMockId();

    const updates = [
      { id: existingCurrency._id, name: "Updated" },
      { id: nonExistentId, name: "Non-existent" },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Updated");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1, modifiedCount: 1, userId: context.auth.user.id },
      "Successfully updated currencies"
    );
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    // Mock Currency.bulkWrite to throw an error
    const originalBulkWrite = Currency.bulkWrite;
    Currency.bulkWrite = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    const updates = [
      {
        id: currency._id,
        name: "Updated",
      },
    ];

    await expect(updateCurrencies(null, { updates }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    Currency.bulkWrite = originalBulkWrite;
  });

  it("should persist changes in database", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "Persisted Update",
        code: "PER",
      },
    ];

    await updateCurrencies(null, { updates }, context);

    // Verify changes were persisted
    const updatedCurrency = await Currency.findById(currency._id);
    expect(updatedCurrency.name).toBe("Persisted Update");
    expect(updatedCurrency.code).toBe("PER");
  });

  it("should handle ObjectId string format", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id.toString(), // string format
        name: "String ID Update",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("String ID Update");
  });

  it("should handle very long currency names", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);
    const longName = "A".repeat(200);

    const updates = [
      {
        id: currency._id,
        name: longName,
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe(longName);
  });

  it("should handle currency codes with different cases", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        code: "eur", // lowercase
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].code).toBe("eur");
  });

  it("should handle empty string values", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: "",
        code: "",
        symbol: "",
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBe("");
    expect(result[0].code).toBe("");
    expect(result[0].symbol).toBe("");
  });

  it("should handle null values", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    const updates = [
      {
        id: currency._id,
        name: null,
        symbol: null,
      },
    ];

    const result = await updateCurrencies(null, { updates }, context);

    expect(result[0].name).toBeNull();
    expect(result[0].symbol).toBeNull();
  });

  it("should handle multiple updates to same currency", async () => {
    const context = global.createMockContext();
    const currency = await createCurrencyInDB({}, context);

    // First update
    const firstUpdates = [
      {
        id: currency._id,
        name: "First Update",
      },
    ];

    await updateCurrencies(null, { updates: firstUpdates }, context);

    // Second update
    const secondUpdates = [
      {
        id: currency._id,
        code: "SEC",
      },
    ];

    const result = await updateCurrencies(
      null,
      { updates: secondUpdates },
      context
    );

    expect(result[0].name).toBe("First Update"); // from first update
    expect(result[0].code).toBe("SEC"); // from second update
  });
});
