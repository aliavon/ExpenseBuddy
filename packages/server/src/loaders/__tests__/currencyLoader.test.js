const createCurrencyLoader = require("../currencyLoader");
const Currency = require("../../database/schemas/Currency");

describe("currencyLoader", () => {
  let currencyLoader;

  beforeEach(() => {
    currencyLoader = createCurrencyLoader();
  });

  it("should create a DataLoader instance", () => {
    expect(currencyLoader).toBeDefined();
    expect(typeof currencyLoader.load).toBe("function");
    expect(typeof currencyLoader.loadMany).toBe("function");
  });

  it("should load single currency by id", async () => {
    const currency = await Currency.create({
      name: "USD",
      symbol: "$",
      code: "USD",
    });

    const result = await currencyLoader.load(currency._id);
    expect(result.name).toBe("USD");
    expect(result.symbol).toBe("$");
    expect(result.code).toBe("USD");
  });

  it("should load multiple currencies in batch", async () => {
    const currencies = await Currency.create([
      { name: "USD", symbol: "$", code: "USD" },
      { name: "EUR", symbol: "€", code: "EUR" },
      { name: "GBP", symbol: "£", code: "GBP" },
    ]);

    const ids = currencies.map((c) => c._id);
    const results = await currencyLoader.loadMany(ids);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe("USD");
    expect(results[1].name).toBe("EUR");
    expect(results[2].name).toBe("GBP");
  });

  it("should return null for non-existent currency", async () => {
    const nonExistentId = global.createMockId();
    const result = await currencyLoader.load(nonExistentId);
    expect(result).toBeNull();
  });

  it("should handle mixed existing and non-existing currencies", async () => {
    const currency = await Currency.create({
      name: "USD",
      symbol: "$",
      code: "USD",
    });
    const nonExistentId = global.createMockId();

    const results = await currencyLoader.loadMany([
      currency._id,
      nonExistentId,
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("USD");
    expect(results[1]).toBeNull();
  });

  it("should handle errors gracefully", async () => {
    const spy = jest
      .spyOn(Currency, "find")
      .mockRejectedValue(new Error("Database error"));

    await expect(currencyLoader.load(global.createMockId())).rejects.toThrow(
      "Database error"
    );
    spy.mockRestore();
  });
});
