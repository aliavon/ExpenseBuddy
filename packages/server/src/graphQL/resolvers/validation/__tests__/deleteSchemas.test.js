const deleteCurrenciesSchema = require("../deleteCurrenciesSchema");
const deleteFamilyIncomesSchema = require("../deleteFamilyIncomesSchema");
const deleteIncomeTypesSchema = require("../deleteIncomeTypesSchema");
const deletePurchasesSchema = require("../deletePurchasesSchema");
const deleteUserSchema = require("../deleteUserSchema");

describe("Delete Schemas Validation", () => {
  const validObjectId = "507f1f77bcf86cd799439011";
  const invalidObjectId = "invalid-id";

  describe("deleteCurrenciesSchema", () => {
    it("should validate with valid ObjectIds", () => {
      const validInput = {
        ids: [validObjectId, "507f1f77bcf86cd799439012"]
      };

      const { error } = deleteCurrenciesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when ids is missing", () => {
      const invalidInput = {};

      const { error } = deleteCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"ids" is required');
    });

    it("should fail when ids is empty array", () => {
      const invalidInput = { ids: [] };

      const { error } = deleteCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"ids" must contain at least one element');
    });

    it("should fail when ids contains invalid ObjectId", () => {
      const invalidInput = { ids: [invalidObjectId] };

      const { error } = deleteCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"ids" must contain valid ObjectIds');
    });

    it("should fail when ids is not an array", () => {
      const invalidInput = { ids: "not-an-array" };

      const { error } = deleteCurrenciesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"ids" must be an array');
    });
  });

  describe("deleteFamilyIncomesSchema", () => {
    it("should validate with valid ObjectIds", () => {
      const validInput = { ids: [validObjectId] };

      const { error } = deleteFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = { ids: [invalidObjectId] };

      const { error } = deleteFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
    });
  });

  describe("deleteIncomeTypesSchema", () => {
    it("should validate with valid ObjectIds", () => {
      const validInput = { ids: [validObjectId] };

      const { error } = deleteIncomeTypesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = { ids: [invalidObjectId] };

      const { error } = deleteIncomeTypesSchema.validate(invalidInput);
      expect(error).toBeDefined();
    });
  });

  describe("deletePurchasesSchema", () => {
    it("should validate with valid ObjectIds", () => {
      const validInput = { ids: [validObjectId] };

      const { error } = deletePurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = { ids: [invalidObjectId] };

      const { error } = deletePurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
    });
  });

  describe("deleteUserSchema", () => {
    it("should validate with valid ObjectId", () => {
      const validInput = { id: validObjectId };

      const { error } = deleteUserSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when id is missing", () => {
      const invalidInput = {};

      const { error } = deleteUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = { id: invalidObjectId };

      const { error } = deleteUserSchema.validate(invalidInput);
      expect(error).toBeDefined();
    });
  });
}); 