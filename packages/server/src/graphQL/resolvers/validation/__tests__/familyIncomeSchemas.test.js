const createFamilyIncomesSchema = require("../createFamilyIncomesSchema");
const updateFamilyIncomesSchema = require("../updateFamilyIncomesSchema");

describe("Family Income Schemas Validation", () => {
  const validObjectId = "507f1f77bcf86cd799439011";
  const validObjectId2 = "507f1f77bcf86cd799439012";
  const validObjectId3 = "507f1f77bcf86cd799439013";

  describe("createFamilyIncomesSchema", () => {
    it("should validate with all required fields", () => {
      const validInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          amount: 5000,
          note: "Monthly salary",
          periodicity: "MONTHLY",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty note", () => {
      const validInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          amount: 5000,
          note: "",
          periodicity: "ONE_TIME",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with different periodicity values", () => {
      const validInput = {
        familyIncomes: [
          {
            date: "2024-01-15T00:00:00.000Z",
            amount: 100,
            periodicity: "DAILY",
            typeId: validObjectId,
            contributorId: validObjectId2,
            currencyId: validObjectId3
          },
          {
            date: "2024-01-15T00:00:00.000Z",
            amount: 700,
            periodicity: "WEEKLY",
            typeId: validObjectId,
            contributorId: validObjectId2,
            currencyId: validObjectId3
          },
          {
            date: "2024-01-15T00:00:00.000Z",
            amount: 60000,
            periodicity: "YEARLY",
            typeId: validObjectId,
            contributorId: validObjectId2,
            currencyId: validObjectId3
          }
        ]
      };

      const { error } = createFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when familyIncomes is missing", () => {
      const invalidInput = {};

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"familyIncomes" is required');
    });

    it("should fail when familyIncomes is empty array", () => {
      const invalidInput = { familyIncomes: [] };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"familyIncomes" must contain at least one element');
    });

    it("should fail when date is missing", () => {
      const invalidInput = {
        familyIncomes: [{
          amount: 5000,
          periodicity: "MONTHLY",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"date" is required');
    });

    it("should fail when date is invalid", () => {
      const invalidInput = {
        familyIncomes: [{
          date: "invalid-date",
          amount: 5000,
          periodicity: "MONTHLY",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"date" must be a valid ISO date');
    });

    it("should fail when amount is missing", () => {
      const invalidInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          periodicity: "MONTHLY",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"amount" is required');
    });

    it("should fail when amount is not positive", () => {
      const invalidInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          amount: -100,
          periodicity: "MONTHLY",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"amount" must be positive');
    });

    it("should fail when periodicity is invalid", () => {
      const invalidInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          amount: 5000,
          periodicity: "INVALID",
          typeId: validObjectId,
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"periodicity" must be one of [ONE_TIME, DAILY, WEEKLY, MONTHLY, YEARLY]');
    });

    it("should fail when typeId is invalid ObjectId", () => {
      const invalidInput = {
        familyIncomes: [{
          date: "2024-01-15T00:00:00.000Z",
          amount: 5000,
          periodicity: "MONTHLY",
          typeId: "invalid-id",
          contributorId: validObjectId2,
          currencyId: validObjectId3
        }]
      };

      const { error } = createFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"typeId" must be a valid ObjectId');
    });
  });

  describe("updateFamilyIncomesSchema", () => {
    it("should validate with id only", () => {
      const validInput = {
        updates: [{
          id: validObjectId
        }]
      };

      const { error } = updateFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with all optional fields", () => {
      const validInput = {
        updates: [{
          id: validObjectId,
          date: "2024-01-15T00:00:00.000Z",
          amount: 6000,
          note: "Updated salary",
          periodicity: "MONTHLY",
          typeId: validObjectId2,
          contributorId: validObjectId3,
          currencyId: validObjectId
        }]
      };

      const { error } = updateFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with multiple updates", () => {
      const validInput = {
        updates: [
          { id: validObjectId, amount: 5500 },
          { id: validObjectId2, periodicity: "WEEKLY" }
        ]
      };

      const { error } = updateFamilyIncomesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when updates is missing", () => {
      const invalidInput = {};

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" is required');
    });

    it("should fail when updates is empty array", () => {
      const invalidInput = { updates: [] };

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"updates" must contain at least one element');
    });

    it("should fail when id is missing", () => {
      const invalidInput = {
        updates: [{ amount: 5000 }]
      };

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" is required');
    });

    it("should fail with invalid ObjectId", () => {
      const invalidInput = {
        updates: [{ id: "invalid-id" }]
      };

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"id" must be a valid ObjectId');
    });

    it("should fail when amount is not positive", () => {
      const invalidInput = {
        updates: [{
          id: validObjectId,
          amount: 0
        }]
      };

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"amount" must be positive');
    });

    it("should fail when periodicity is invalid", () => {
      const invalidInput = {
        updates: [{
          id: validObjectId,
          periodicity: "INVALID_PERIOD"
        }]
      };

      const { error } = updateFamilyIncomesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"periodicity" must be one of [ONE_TIME, DAILY, WEEKLY, MONTHLY, YEARLY]');
    });
  });
}); 