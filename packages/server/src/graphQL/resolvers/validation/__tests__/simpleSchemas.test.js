const itemInputSchema = require("../itemInputSchema");
const purchaseInputSchema = require("../purchaseInputSchema");
const addItemsSchema = require("../addItemsSchema");
const addPurchasesSchema = require("../addPurchasesSchema");
const editItemsCategorySchema = require("../editItemsCategorySchema");

describe("Simple Validation Schemas", () => {
  describe("itemInputSchema", () => {
    it("should validate with required name", () => {
      const validInput = { name: "Test Item" };

      const { error } = itemInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with name and category", () => {
      const validInput = { name: "Test Item", category: "Food" };

      const { error } = itemInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty category", () => {
      const validInput = { name: "Test Item", category: "" };

      const { error } = itemInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when name is missing", () => {
      const invalidInput = {};

      const { error } = itemInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" is required');
    });

    it("should fail when name is empty", () => {
      const invalidInput = { name: "" };

      const { error } = itemInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" is not allowed to be empty');
    });

    it("should fail when name is not a string", () => {
      const invalidInput = { name: 123 };

      const { error } = itemInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });
  });

  describe("purchaseInputSchema", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should validate with all required fields", () => {
      const validInput = {
        itemId: validObjectId,
        quantity: 2,
        unit: "kg",
        price: 10.99,
        date: new Date().toISOString(),
        discount: 0,
        note: "Test purchase"
      };

      const { error } = purchaseInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with minimal required fields", () => {
      const validInput = {
        itemId: validObjectId,
        quantity: 1,
        unit: "piece",
        price: 5.99,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when itemId is missing", () => {
      const invalidInput = {
        quantity: 1,
        unit: "piece",
        price: 10.99,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"itemId" is required');
    });

    it("should fail when quantity is missing", () => {
      const invalidInput = {
        itemId: validObjectId,
        unit: "piece",
        price: 10.99,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"quantity" is required');
    });

    it("should fail when quantity is not positive", () => {
      const invalidInput = {
        itemId: validObjectId,
        quantity: 0,
        unit: "piece",
        price: 10.99,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"quantity" must be a positive number');
    });

    it("should fail when unit is missing", () => {
      const invalidInput = {
        itemId: validObjectId,
        quantity: 1,
        price: 10.99,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"unit" is required');
    });

    it("should fail when price is not positive", () => {
      const invalidInput = {
        itemId: validObjectId,
        quantity: 1,
        unit: "piece",
        price: 0,
        date: new Date().toISOString()
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"price" must be a positive number');
    });

    it("should fail when date is invalid", () => {
      const invalidInput = {
        itemId: validObjectId,
        quantity: 1,
        unit: "piece",
        price: 10.99,
        date: "invalid-date"
      };

      const { error } = purchaseInputSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"date" must be in iso format');
    });
  });

  describe("addItemsSchema", () => {
    it("should validate with valid items array", () => {
      const validInput = {
        items: [{ name: "Item 1" }, { name: "Item 2", category: "Food" }]
      };

      const { error } = addItemsSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty items array", () => {
      const validInput = { items: [] };

      const { error } = addItemsSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when items is missing", () => {
      const invalidInput = {};

      const { error } = addItemsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"items" is required');
    });

    it("should fail when items contains invalid item", () => {
      const invalidInput = {
        items: [{ name: "" }]
      };

      const { error } = addItemsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"items[0].name" is not allowed to be empty');
    });
  });

  describe("addPurchasesSchema", () => {
    const validObjectId = "507f1f77bcf86cd799439011";

    it("should validate with valid purchases array", () => {
      const validInput = {
        purchases: [{
          itemId: validObjectId,
          quantity: 1,
          unit: "piece",
          price: 10.99,
          date: new Date().toISOString()
        }]
      };

      const { error } = addPurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should validate with empty purchases array", () => {
      const validInput = { purchases: [] };

      const { error } = addPurchasesSchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when purchases is missing", () => {
      const invalidInput = {};

      const { error } = addPurchasesSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"purchases" is required');
    });
  });

  describe("editItemsCategorySchema", () => {
    it("should validate with valid category update", () => {
      const validInput = {
        names: ["Item 1", "Item 2"],
        newCategory: "New Category"
      };

      const { error } = editItemsCategorySchema.validate(validInput);
      expect(error).toBeUndefined();
    });

    it("should fail when names is missing", () => {
      const invalidInput = { newCategory: "New Category" };

      const { error } = editItemsCategorySchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names" is required');
    });

    it("should fail when newCategory is missing", () => {
      const invalidInput = { names: ["Item 1"] };

      const { error } = editItemsCategorySchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"newCategory" is required');
    });

    it("should fail when names array is empty", () => {
      const invalidInput = {
        names: [],
        newCategory: "New Category"
      };

      const { error } = editItemsCategorySchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names" must contain at least 1 items');
    });

    it("should fail when names contains empty string", () => {
      const invalidInput = {
        names: ["Item 1", ""],
        newCategory: "New Category"
      };

      const { error } = editItemsCategorySchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"names[1]" is not allowed to be empty');
    });
  });
}); 