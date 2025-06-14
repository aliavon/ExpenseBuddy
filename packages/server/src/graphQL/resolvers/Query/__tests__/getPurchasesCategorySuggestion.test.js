const getPurchasesCategorySuggestion = require("../getPurchasesCategorySuggestion");
const { Item } = require("../../../../database/schemas");

describe("getPurchasesCategorySuggestion resolver", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
  });

  it("should return category suggestions for existing items", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "Carrot"] }, 
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "Apple", category: "Fruits" });
    expect(result).toContainEqual({ name: "Carrot", category: "Vegetables" });
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully retrieved purchases category suggestion"
    );
  });

  it("should return null category for non-existing items", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "NonExistent"] }, 
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "Apple", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent", category: null });
  });

  it("should handle empty names array", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: [] }, 
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved purchases category suggestion"
    );
  });

  it("should maintain order of input names", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Carrot", "Apple", "Banana"] }, 
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: "Carrot", category: "Vegetables" });
    expect(result[1]).toEqual({ name: "Apple", category: "Fruits" });
    expect(result[2]).toEqual({ name: "Banana", category: "Fruits" });
  });

  it("should handle duplicate names in input", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "Apple", "Apple"] }, 
      context
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { name: "Apple", category: "Fruits" },
      { name: "Apple", category: "Fruits" },
      { name: "Apple", category: "Fruits" },
    ]);
  });

  it("should handle items with same name but different categories", async () => {
    // This scenario might not be realistic in practice, but testing edge case
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Apple", category: "Organic" }, // Duplicate name, different category
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple"] }, 
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
    // Should return one of the categories (implementation dependent)
    expect(["Fruits", "Organic"]).toContain(result[0].category);
  });

  it("should handle case-sensitive name matching", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "apple", category: "Fruits" }, // lowercase
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "apple"] }, 
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Apple", category: "Fruits" });
    expect(result[1]).toEqual({ name: "apple", category: "Fruits" });
  });

  it("should handle special characters in names", async () => {
    await Item.create([
      { name: "Café Latte", category: "Beverages" },
      { name: "Piña Colada", category: "Beverages" },
      { name: "Crème Brûlée", category: "Desserts" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Café Latte", "Piña Colada"] }, 
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "Café Latte", category: "Beverages" });
    expect(result).toContainEqual({ name: "Piña Colada", category: "Beverages" });
  });

  it("should handle large number of names", async () => {
    const items = [];
    const names = [];
    for (let i = 1; i <= 100; i++) {
      items.push({ name: `Item${i}`, category: `Category${i % 10}` });
      names.push(`Item${i}`);
    }
    await Item.create(items);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names }, 
      context
    );

    expect(result).toHaveLength(100);
    expect(result.every(item => item.category !== null)).toBe(true);
  });

  it("should handle mixed existing and non-existing items", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "NonExistent1", "Banana", "NonExistent2"] }, 
      context
    );

    expect(result).toHaveLength(4);
    expect(result).toContainEqual({ name: "Apple", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent1", category: null });
    expect(result).toContainEqual({ name: "Banana", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent2", category: null });
  });

  it("should handle items with null or empty categories", async () => {
    // Create items with null category directly in database
    await Item.collection.insertMany([
      { name: "Item1", category: null },
      { name: "Item2", category: "" },
      { name: "Item3", category: "ValidCategory" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Item1", "Item2", "Item3"] }, 
      context
    );

    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ name: "Item1", category: null });
    expect(result).toContainEqual({ name: "Item2", category: "" });
    expect(result).toContainEqual({ name: "Item3", category: "ValidCategory" });
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    
    // Mock Item.find to throw an error
    const originalFind = Item.find;
    Item.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple"] }, 
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    Item.find = originalFind;
  });

  it("should handle very long item names", async () => {
    const longName = "A".repeat(200);
    await Item.create([
      { name: longName, category: "LongNames" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: [longName] }, 
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: longName, category: "LongNames" });
  });

  it("should handle whitespace in item names", async () => {
    await Item.create([
      { name: "  Apple  ", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getPurchasesCategorySuggestion(
      null, 
      { names: ["  Apple  ", "Apple"] }, 
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "  Apple  ", category: "Fruits" });
    expect(result[1]).toEqual({ name: "Apple", category: null }); // Exact match required
  });

  it("should return consistent results for same input", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result1 = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "Banana", "NonExistent"] }, 
      context
    );
    const result2 = await getPurchasesCategorySuggestion(
      null, 
      { names: ["Apple", "Banana", "NonExistent"] }, 
      context
    );

    expect(result1).toEqual(result2);
  });
}); 