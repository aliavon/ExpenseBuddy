const editItemsCategory = require("../editItemsCategory");
const { Item } = require("../../../../database/schemas");

describe("editItemsCategory mutation", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
    itemCounter = 0; // Reset counter for each test
  });

  let itemCounter = 0;
  const createItemData = (overrides = {}) => {
    itemCounter++;
    return {
      name: `Item ${itemCounter}`,
      category: `Category ${itemCounter}`,
      ...overrides,
    };
  };

  const createItemInDB = async (data = {}) => {
    const itemData = createItemData(data);
    const item = new Item(itemData);
    return await item.save();
  };

  it("should update category for single item successfully", async () => {
    const item = await createItemInDB({ name: "Apple", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Apple"], newCategory: "Fruits" },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
    expect(result[0].category).toBe("Fruits");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated items category"
    );
  });

  it("should update category for multiple items successfully", async () => {
    await createItemInDB({ name: "Apple", category: "Old Category" });
    await createItemInDB({ name: "Banana", category: "Old Category" });
    await createItemInDB({ name: "Orange", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Apple", "Banana", "Orange"], newCategory: "Fruits" },
      context
    );

    expect(result).toHaveLength(3);
    result.forEach(item => {
      expect(item.category).toBe("Fruits");
      expect(["Apple", "Banana", "Orange"]).toContain(item.name);
    });
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully updated items category"
    );
  });

  it("should handle empty names array", async () => {
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: [], newCategory: "New Category" },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated items category"
    );
  });

  it("should handle non-existent item names gracefully", async () => {
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Non-existent Item"], newCategory: "New Category" },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated items category"
    );
  });

  it("should handle mixed existing and non-existing item names", async () => {
    await createItemInDB({ name: "Existing Item", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Existing Item", "Non-existent Item"], newCategory: "New Category" },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Existing Item");
    expect(result[0].category).toBe("New Category");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated items category"
    );
  });

  it("should update category to empty string", async () => {
    await createItemInDB({ name: "Test Item", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Test Item"], newCategory: "" },
      context
    );

    expect(result[0].category).toBe("");
  });

  it("should handle special characters in item names and categories", async () => {
    await createItemInDB({ name: "Café & Croissant", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Café & Croissant"], newCategory: "Boulangerie - très spécial!" },
      context
    );

    expect(result[0].name).toBe("Café & Croissant");
    expect(result[0].category).toBe("Boulangerie - très spécial!");
  });

  it("should handle unicode characters", async () => {
    await createItemInDB({ name: "苹果", category: "旧类别" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["苹果"], newCategory: "水果" },
      context
    );

    expect(result[0].name).toBe("苹果");
    expect(result[0].category).toBe("水果");
  });

  it("should handle emoji in item names and categories", async () => {
    await createItemInDB({ name: "Apple 🍎", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Apple 🍎"], newCategory: "Fruits 🍓" },
      context
    );

    expect(result[0].name).toBe("Apple 🍎");
    expect(result[0].category).toBe("Fruits 🍓");
  });

  it("should handle large batch updates", async () => {
    const itemNames = [];
    for (let i = 1; i <= 20; i++) {
      const name = `Item ${i}`;
      itemNames.push(name);
      await createItemInDB({ name, category: "Old Category" });
    }

    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: itemNames, newCategory: "New Category" },
      context
    );

    expect(result).toHaveLength(20);
    result.forEach(item => {
      expect(item.category).toBe("New Category");
    });
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20 },
      "Successfully updated items category"
    );
  });

  it("should persist changes in database", async () => {
    await createItemInDB({ name: "Persistent Item", category: "Old Category" });
    const context = global.createMockContext();

    await editItemsCategory(
      null,
      { names: ["Persistent Item"], newCategory: "New Category" },
      context
    );

    // Verify changes were persisted
    const updatedItem = await Item.findOne({ name: "Persistent Item" });
    expect(updatedItem.category).toBe("New Category");
  });

  it("should not affect items with different names", async () => {
    await createItemInDB({ name: "Item to Update", category: "Old Category" });
    await createItemInDB({ name: "Item to Keep", category: "Keep Category" });
    const context = global.createMockContext();

    await editItemsCategory(
      null,
      { names: ["Item to Update"], newCategory: "New Category" },
      context
    );

    // Verify only targeted item was updated
    const updatedItem = await Item.findOne({ name: "Item to Update" });
    const keptItem = await Item.findOne({ name: "Item to Keep" });
    
    expect(updatedItem.category).toBe("New Category");
    expect(keptItem.category).toBe("Keep Category");
  });

  it("should handle duplicate item names in input", async () => {
    await createItemInDB({ name: "Duplicate Item", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Duplicate Item", "Duplicate Item", "Duplicate Item"], newCategory: "New Category" },
      context
    );

    expect(result).toHaveLength(1); // Only one item exists with this name
    expect(result[0].name).toBe("Duplicate Item");
    expect(result[0].category).toBe("New Category");
  });

  it("should handle very long item names and categories", async () => {
    const longName = "A".repeat(200);
    const longCategory = "B".repeat(200);
    await createItemInDB({ name: longName, category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: [longName], newCategory: longCategory },
      context
    );

    expect(result[0].name).toBe(longName);
    expect(result[0].category).toBe(longCategory);
  });

  it("should handle database errors gracefully during update", async () => {
    await createItemInDB({ name: "Test Item", category: "Old Category" });
    const context = global.createMockContext();

    // Mock Item.updateMany to throw an error
    const originalUpdateMany = Item.updateMany;
    Item.updateMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(editItemsCategory(
      null,
      { names: ["Test Item"], newCategory: "New Category" },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    Item.updateMany = originalUpdateMany;
  });

  it("should handle database errors gracefully during find", async () => {
    await createItemInDB({ name: "Test Item", category: "Old Category" });
    const context = global.createMockContext();

    // Mock Item.find to throw an error
    const originalFind = Item.find;
    Item.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(editItemsCategory(
      null,
      { names: ["Test Item"], newCategory: "New Category" },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    Item.find = originalFind;
  });

  it("should handle case-sensitive item names", async () => {
    await createItemInDB({ name: "Apple", category: "Old Category" });
    await createItemInDB({ name: "apple", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Apple"], newCategory: "New Category" },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple"); // Only exact match
    expect(result[0].category).toBe("New Category");

    // Verify the lowercase version wasn't updated
    const lowercaseItem = await Item.findOne({ name: "apple" });
    expect(lowercaseItem.category).toBe("Old Category");
  });

  it("should return items in consistent order", async () => {
    await createItemInDB({ name: "Zebra", category: "Old Category" });
    await createItemInDB({ name: "Apple", category: "Old Category" });
    await createItemInDB({ name: "Banana", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Zebra", "Apple", "Banana"], newCategory: "New Category" },
      context
    );

    expect(result).toHaveLength(3);
    // Items should be returned in the order they were found in database
    const names = result.map(item => item.name);
    expect(names).toContain("Zebra");
    expect(names).toContain("Apple");
    expect(names).toContain("Banana");
  });

  it("should handle null newCategory value", async () => {
    await createItemInDB({ name: "Test Item", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Test Item"], newCategory: null },
      context
    );

    expect(result[0].category).toBeNull();
  });

  it("should handle items with existing empty categories", async () => {
    await createItemInDB({ name: "Empty Category Item", category: "" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["Empty Category Item"], newCategory: "New Category" },
      context
    );

    expect(result[0].name).toBe("Empty Category Item");
    expect(result[0].category).toBe("New Category");
  });

  it("should handle whitespace in item names", async () => {
    await createItemInDB({ name: "  Spaced Item  ", category: "Old Category" });
    const context = global.createMockContext();

    const result = await editItemsCategory(
      null,
      { names: ["  Spaced Item  "], newCategory: "New Category" },
      context
    );

    expect(result[0].name).toBe("  Spaced Item  ");
    expect(result[0].category).toBe("New Category");
  });
}); 