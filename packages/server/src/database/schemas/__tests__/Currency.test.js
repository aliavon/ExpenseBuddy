const Currency = require("../Currency");

describe("Currency Schema", () => {
  it("should create currency with required fields", async () => {
    const currencyData = {
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    };

    const currency = new Currency(currencyData);
    const savedCurrency = await currency.save();

    expect(savedCurrency.name).toBe(currencyData.name);
    expect(savedCurrency.code).toBe(currencyData.code);
    expect(savedCurrency.symbol).toBe(currencyData.symbol);
    expect(savedCurrency._id).toBeDefined();
  });

  it("should create currency with default empty symbol", async () => {
    const currencyData = {
      name: "Euro",
      code: "EUR",
    };

    const currency = new Currency(currencyData);
    const savedCurrency = await currency.save();

    expect(savedCurrency.symbol).toBe("");
  });

  it("should fail validation without name", async () => {
    const currency = new Currency({
      code: "USD",
    });

    let error;
    try {
      await currency.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("should fail validation without code", async () => {
    const currency = new Currency({
      name: "US Dollar",
    });

    let error;
    try {
      await currency.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.code).toBeDefined();
  });

  it("should enforce unique name constraint", async () => {
    await Currency.create({
      name: "US Dollar",
      code: "USD",
    });

    const duplicateCurrency = new Currency({
      name: "US Dollar",
      code: "USD2",
    });

    let error;
    try {
      await duplicateCurrency.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });

  it("should enforce unique code constraint", async () => {
    await Currency.create({
      name: "US Dollar",
      code: "USD",
    });

    const duplicateCurrency = new Currency({
      name: "United States Dollar",
      code: "USD",
    });

    let error;
    try {
      await duplicateCurrency.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  it("should find currencies by code", async () => {
    await Currency.create([
      { name: "US Dollar", code: "USD", symbol: "$" },
      { name: "Euro", code: "EUR", symbol: "€" },
      { name: "British Pound", code: "GBP", symbol: "£" },
    ]);

    const usd = await Currency.findOne({ code: "USD" });
    expect(usd.name).toBe("US Dollar");
    expect(usd.symbol).toBe("$");
  });

  it("should update currency fields", async () => {
    const currency = await Currency.create({
      name: "US Dollar",
      code: "USD",
    });

    currency.symbol = "$";
    const updatedCurrency = await currency.save();

    expect(updatedCurrency.symbol).toBe("$");
  });
});
