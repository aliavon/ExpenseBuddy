const updateCurrenciesSchema = require("../updateCurrenciesSchema");
const updateIncomeTypesSchema = require("../updateIncomeTypesSchema");

describe("Update Currency and Income Type Schemas", () => {
  const validObjectId = "507f1f77bcf86cd799439011";

  describe("updateCurrenciesSchema", () => {
    it("should validate with valid updates array", () => {
      const validInput = {
        updates: [{
          id: validObjectId,
          name: "US Dollar",
          code: "USD",
          symbol: "$"
        }]
      };

      const { error } = updateCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with only required id", () => {
      const validInput = {
        updates: [{
          id: validObjectId
        }]
      };

      const { error } = updateCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with partial updates", () => {
      const validInput = {
        updates: [{
          id: validObjectId,
          name: "Euro"
        }]
      };

      const { error } = updateCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with multiple currencies", () => {
      const validInput = {
        updates: [
          { id: validObjectId, name: "US Dollar" },
          { id: "507f1f77bcf86cd799439012", code: "EUR" }
        ]
      };

      const { error } = updateCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when updates is missing", () => {
      const invalidInput = {};

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" is required');
    });

    it("should fail when updates is empty array", () => {
      const invalidInput = { updates: [] };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" must contain at least one element');
    });

    it("should fail when updates is not an array", () => {
      const invalidInput = { updates: "not-array" };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" must be an array');
    });

    it("should fail when id is missing in update", () => {
      const invalidInput = {
        updates: [{ name: "US Dollar" }]
      };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = {
        updates: [{ id: "invalid-id" }]
      };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" must be a valid ObjectId');
    });

    it("should fail when name is empty", () => {
      const invalidInput = {
        updates: [{ id: validObjectId, name: "" }]
      };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" cannot be empty');
    });

    it("should fail when code is empty", () => {
      const invalidInput = {
        updates: [{ id: validObjectId, code: "" }]
      };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"code" cannot be empty');
    });

    it("should fail when symbol is not a string", () => {
      const invalidInput = {
        updates: [{ id: validObjectId, symbol: 123 }]
      };

      const { error } = updateCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"symbol" must be a string');
    });
  });

  describe("updateIncomeTypesSchema", () => {
    it("should validate with valid updates array", () => {
      const validInput = {
        updates: [{
          id: validObjectId,
          name: "Salary",
          description: "Monthly salary income"
        }]
      };

      const { error } = updateIncomeTypesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with only required id", () => {
      const validInput = {
        updates: [{
          id: validObjectId
        }]
      };

      const { error } = updateIncomeTypesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty description", () => {
      const validInput = {
        updates: [{
          id: validObjectId,
          description: ""
        }]
      };

      const { error } = updateIncomeTypesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with multiple income types", () => {
      const validInput = {
        updates: [
          { id: validObjectId, name: "Salary" },
          { id: "507f1f77bcf86cd799439012", name: "Bonus", description: "Annual bonus" }
        ]
      };

      const { error } = updateIncomeTypesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when updates is missing", () => {
      const invalidInput = {};

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" is required');
    });

    it("should fail when updates is empty array", () => {
      const invalidInput = { updates: [] };

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" must contain at least one element');
    });

    it("should fail when id is missing", () => {
      const invalidInput = {
        updates: [{ name: "Salary" }]
      };

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = {
        updates: [{ id: "invalid-id" }]
      };

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" must be a valid ObjectId');
    });

    it("should fail when name is empty", () => {
      const invalidInput = {
        updates: [{ id: validObjectId, name: "" }]
      };

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" cannot be empty');
    });

    it("should fail when description is not a string", () => {
      const invalidInput = {
        updates: [{ id: validObjectId, description: 123 }]
      };

      const { error } = updateIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"description" must be a string');
    });
  });
}); 