const getCurrencies = require("../getCurrencies");
const Currency = require("../../../../database/schemas/Currency");

describe("getCurrencies resolver", () => {
  it("should return all currencies", async () => {
    await Currency.create([
      { name: "USD", symbol: "$", code: "USD" },
      { name: "EUR", symbol: "€", code: "EUR" },
      { name: "GBP", symbol: "£", code: "GBP" },
    ]);

    const context = global.createMockContext();
    const result = await getCurrencies(null, {}, context);

    expect(result).toHaveLength(3);

    const names = result.map((currency) => currency.name);
    expect(names).toContain("USD");
    expect(names).toContain("EUR");
    expect(names).toContain("GBP");
  });

  it("should return empty array when no currencies exist", async () => {
    const context = global.createMockContext();
    const result = await getCurrencies(null, {}, context);

    expect(result).toEqual([]);
  });

  it("should handle database errors", async () => {
    const spy = jest
      .spyOn(Currency, "find")
      .mockRejectedValue(new Error("Database error"));
    const context = global.createMockContext();

    await expect(getCurrencies(null, {}, context)).rejects.toThrow(
      "Database error"
    );
    spy.mockRestore();
  });
});
