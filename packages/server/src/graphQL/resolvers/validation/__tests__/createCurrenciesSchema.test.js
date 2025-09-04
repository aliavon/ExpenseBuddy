const createCurrenciesSchema = require("../createCurrenciesSchema");

describe("createCurrenciesSchema validation", () => {
  describe("valid inputs", () => {
    it("should validate with all required fields", () => {
      const validInput = {
        currencies: [
          { name: "US Dollar", code: "USD", symbol: "$" },
          { name: "Euro", code: "EUR", symbol: "€" },
        ],
      };

      const { error } = createCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate without optional symbol", () => {
      const validInput = {
        currencies: [{ name: "Bitcoin", code: "BTC" }],
      };

      const { error } = createCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with single currency", () => {
      const validInput = {
        currencies: [{ name: "US Dollar", code: "USD", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });
  });

  describe("invalid inputs", () => {
    it("should fail when currencies is missing", () => {
      const invalidInput = {};

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"currencies" is required');
    });

    it("should fail when currencies is empty array", () => {
      const invalidInput = {
        currencies: [],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"currencies" must contain at least one element'
      );
    });

    it("should fail when currencies is not an array", () => {
      const invalidInput = {
        currencies: "not an array",
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"currencies" must be an array');
    });

    it("should fail when currency name is missing", () => {
      const invalidInput = {
        currencies: [{ code: "USD", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" is required');
    });

    it("should fail when currency name is empty", () => {
      const invalidInput = {
        currencies: [{ name: "", code: "USD", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" cannot be empty');
    });

    it("should fail when currency code is missing", () => {
      const invalidInput = {
        currencies: [{ name: "US Dollar", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"code" is required');
    });

    it("should fail when currency code is empty", () => {
      const invalidInput = {
        currencies: [{ name: "US Dollar", code: "", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"code" cannot be empty');
    });

    it("should fail when name is not a string", () => {
      const invalidInput = {
        currencies: [{ name: 123, code: "USD", symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });

    it("should fail when code is not a string", () => {
      const invalidInput = {
        currencies: [{ name: "US Dollar", code: 123, symbol: "$" }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"code" must be a string');
    });

    it("should fail when symbol is not a string", () => {
      const invalidInput = {
        currencies: [{ name: "US Dollar", code: "USD", symbol: 123 }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"symbol" must be a string');
    });

    it("should fail with multiple validation errors", () => {
      const invalidInput = {
        currencies: [{ name: "", code: "", symbol: 123 }],
      };

      const { error } = createCurrenciesSchema.validate(invalidInput, {
        abortEarly: false,
      });
      expect(error).toBeDefined();
      expect(error.details).toHaveLength(3);
    });
  });
});
