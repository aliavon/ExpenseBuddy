const createCurrencies = require("../createCurrencies");
const Currency = require("../../../../database/schemas/Currency");

describe("createCurrencies resolver", () => {
  it("should create single currency", async () => {
    const context = global.createMockContext();
    const args = {
      currencies: [{ name: "USD", symbol: "$", code: "USD" }],
    };

    const result = await createCurrencies(null, args, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("USD");
    expect(result[0].symbol).toBe("$");
    expect(result[0].code).toBe("USD");

    const savedCurrency = await Currency.findById(result[0]._id);
    expect(savedCurrency).toBeTruthy();
  });

  it("should create multiple currencies", async () => {
    const context = global.createMockContext();
    const args = {
      currencies: [
        { name: "USD", symbol: "$", code: "USD" },
        { name: "EUR", symbol: "€", code: "EUR" },
        { name: "GBP", symbol: "£", code: "GBP" },
      ],
    };

    const result = await createCurrencies(null, args, context);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("USD");
    expect(result[1].name).toBe("EUR");
    expect(result[2].name).toBe("GBP");

    const savedCount = await Currency.countDocuments();
    expect(savedCount).toBe(3);
  });

  it("should handle validation errors", async () => {
    const context = global.createMockContext();
    const args = {
      currencies: [
        { symbol: "$", code: "USD" }, // missing name
      ],
    };

    await expect(createCurrencies(null, args, context)).rejects.toThrow();
  });

  it("should handle duplicate code errors", async () => {
    await Currency.create({ name: "USD", symbol: "$", code: "USD" });

    const context = global.createMockContext();
    const args = {
      currencies: [
        { name: "US Dollar", symbol: "$", code: "USD" }, // duplicate code
      ],
    };

    await expect(createCurrencies(null, args, context)).rejects.toThrow();
  });

  it("should handle database errors", async () => {
    const spy = jest
      .spyOn(Currency, "insertMany")
      .mockRejectedValue(new Error("Database error"));
    const context = global.createMockContext();
    const args = {
      currencies: [{ name: "USD", symbol: "$", code: "USD" }],
    };

    await expect(createCurrencies(null, args, context)).rejects.toThrow(
      "Database error"
    );
    spy.mockRestore();
  });
});
