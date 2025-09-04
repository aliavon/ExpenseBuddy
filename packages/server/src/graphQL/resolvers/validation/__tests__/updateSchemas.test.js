const updatePurchaseInputSchema = require("../updatePurchaseInputSchema");
const updatePurchasesSchema = require("../updatePurchasesSchema");

describe("Update Schemas Validation", () => {
  const validObjectId = "507f1f77bcf86cd799439011";

  describe("updatePurchaseInputSchema", () => {
    it("should validate with required id only", () => {
      const validInput = { id: validObjectId };

      const { error } = updatePurchaseInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with all optional fields", () => {
      const validInput = {
        id: validObjectId,
        itemId: "507f1f77bcf86cd799439012",
        quantity: 2,
        unit: "kg",
        price: 15.99,
        discount: 5,
        date: new Date().toISOString(),
        note: "Updated purchase",
      };

      const { error } = updatePurchaseInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when id is missing", () => {
      const invalidInput = { quantity: 2 };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = { id: "invalid-id" };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
    });

    it("should fail with negative quantity", () => {
      const invalidInput = {
        id: validObjectId,
        quantity: -1,
      };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"quantity" must be a positive number'
      );
    });

    it("should fail with negative price", () => {
      const invalidInput = {
        id: validObjectId,
        price: -10,
      };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"price" must be a positive number'
      );
    });

    it("should fail with negative discount", () => {
      const invalidInput = {
        id: validObjectId,
        discount: -5,
      };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"discount" must be greater than or equal to 0'
      );
    });

    it("should fail with invalid date format", () => {
      const invalidInput = {
        id: validObjectId,
        date: "invalid-date",
      };

      const { error } = updatePurchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"date" must be in iso format');
    });
  });

  describe("updatePurchasesSchema", () => {
    it("should validate with valid updates array", () => {
      const validInput = {
        updates: [
          {
            id: validObjectId,
            quantity: 2,
          },
        ],
      };

      const { error } = updatePurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty updates array", () => {
      const validInput = { updates: [] };

      const { error } = updatePurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when updates is missing", () => {
      const invalidInput = {};

      const { error } = updatePurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" is required');
    });

    it("should fail with invalid purchase in array", () => {
      const invalidInput = {
        updates: [{ quantity: 2 }], // missing required id
      };

      const { error } = updatePurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates[0].id" is required');
    });
  });
});
