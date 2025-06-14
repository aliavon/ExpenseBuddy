const getItemsSchema = require("../getItemsSchema");
const getPurchasesSchema = require("../getPurchasesSchema");
const getPurchasesCategorySuggestionSchema = require("../getPurchasesCategorySuggestionSchema");
const getUsersSchema = require("../getUsersSchema");

describe("Get Schemas Validation", () => {
  describe("getItemsSchema", () => {
    it("should validate with valid category", () => {
      const validInput = { category: "Food" };

      const { error } = getItemsSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate without category", () => {
      const validInput = {};

      const { error } = getItemsSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty category", () => {
      const validInput = { category: "" };

      const { error } = getItemsSchema.validate(validInput);
      expect(error).toBeUndefined();
    });
  });

  describe("getPurchasesSchema", () => {
    it("should validate with valid date range", () => {
      const validInput = {
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-31T23:59:59.999Z"
      };

      const { error } = getPurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when from is missing", () => {
      const invalidInput = { to: "2024-01-31T23:59:59.999Z" };

      const { error } = getPurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"from" is required');
    });

    it("should fail when to is missing", () => {
      const invalidInput = { from: "2024-01-01T00:00:00.000Z" };

      const { error } = getPurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"to" is required');
    });

    it("should fail with invalid date format", () => {
      const invalidInput = {
        from: "invalid-date",
        to: "2024-01-31T23:59:59.999Z"
      };

      const { error } = getPurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"from" must be in iso format');
    });
  });

  describe("getPurchasesCategorySuggestionSchema", () => {
    it("should validate with valid names array", () => {
      const validInput = { names: ["Apple", "Banana", "Orange"] };

      const { error } = getPurchasesCategorySuggestionSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when names is missing", () => {
      const invalidInput = {};

      const { error } = getPurchasesCategorySuggestionSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names" is required');
    });

    it("should fail when names array is empty", () => {
      const invalidInput = { names: [] };

      const { error } = getPurchasesCategorySuggestionSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names" must contain at least 1 items');
    });

    it("should fail when names contains empty string", () => {
      const invalidInput = { names: ["Apple", ""] };

      const { error } = getPurchasesCategorySuggestionSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names[1]" is not allowed to be empty');
    });
  });

  describe("getUsersSchema", () => {
    it("should validate with valid search string", () => {
      const validInput = { search: "john" };

      const { error } = getUsersSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate without search", () => {
      const validInput = {};

      const { error } = getUsersSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty search", () => {
      const validInput = { search: "" };

      const { error } = getUsersSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when search is not a string", () => {
      const invalidInput = { search: 123 };

      const { error } = getUsersSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"search" must be a string');
    });
  });
}); 