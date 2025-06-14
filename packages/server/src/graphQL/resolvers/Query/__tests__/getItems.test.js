const getItems = require("../getItems");
const { Item } = require("../../../../database/schemas");

describe("getItems resolver", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
  });

  it("should return all items when no filters provided", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, {}, context);

    expect(result).toHaveLength(3);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully retrieved items"
    );
  });

  it("should filter items by names", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
      { name: "Broccoli", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: ["Apple", "Carrot"] }, context);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name)).toContain("Apple");
    expect(result.map(item => item.name)).toContain("Carrot");
    expect(result.map(item => item.name)).not.toContain("Banana");
    expect(result.map(item => item.name)).not.toContain("Broccoli");
  });

  it("should filter items by category", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
      { name: "Broccoli", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "Fruits" }, context);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name)).toContain("Apple");
    expect(result.map(item => item.name)).toContain("Banana");
    expect(result.map(item => item.category)).toEqual(["Fruits", "Fruits"]);
  });

  it("should filter items by both names and category", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
      { name: "Apple", category: "Vegetables" }, // Different category, same name
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { 
      names: ["Apple", "Banana"], 
      category: "Fruits" 
    }, context);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name)).toContain("Apple");
    expect(result.map(item => item.name)).toContain("Banana");
    expect(result.every(item => item.category === "Fruits")).toBe(true);
  });

  it("should return empty array when names filter matches nothing", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: ["Orange", "Grape"] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved items"
    );
  });

  it("should return empty array when category filter matches nothing", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "Dairy" }, context);

    expect(result).toEqual([]);
  });

  it("should handle empty names array", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: [] }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle null names array", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: null }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle empty category string", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "" }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle whitespace-only category string", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "   " }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle case-sensitive category matching", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "fruits" }, // lowercase
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "Fruits" }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
  });

  it("should handle case-sensitive name matching", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "apple", category: "Fruits" }, // lowercase
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: ["Apple"] }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
  });

  it("should handle large number of items", async () => {
    const items = [];
    for (let i = 1; i <= 100; i++) {
      items.push({ name: `Item${i}`, category: `Category${i % 10}` });
    }
    await Item.create(items);

    const context = global.createMockContext();
    const result = await getItems(null, { category: "Category1" }, context);

    expect(result).toHaveLength(10); // Items 1, 11, 21, ..., 91
  });

  it("should handle special characters in names and categories", async () => {
    await Item.create([
      { name: "Café Latte", category: "Beverages & Drinks" },
      { name: "Piña Colada", category: "Beverages & Drinks" },
    ]);

    const context = global.createMockContext();
    const result1 = await getItems(null, { names: ["Café Latte"] }, context);
    const result2 = await getItems(null, { category: "Beverages & Drinks" }, context);

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(2);
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    
    // Mock Item.find to throw an error
    const originalFind = Item.find;
    Item.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(getItems(null, {}, context)).rejects.toThrow("Database connection failed");

    // Restore original method
    Item.find = originalFind;
  });

  it("should return items with all fields", async () => {
    await Item.create([
      { 
        name: "Apple", 
        category: "Fruits",
        description: "Red apple",
        price: 1.50
      },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, {}, context);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Apple");
    expect(result[0]).toHaveProperty("category", "Fruits");
    expect(result[0]).toHaveProperty("_id");
  });

  it("should handle partial name matches in array", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getItems(null, { names: ["Apple", "NonExistent", "Carrot"] }, context);

    expect(result).toHaveLength(2);
    expect(result.map(item => item.name)).toContain("Apple");
    expect(result.map(item => item.name)).toContain("Carrot");
    expect(result.map(item => item.name)).not.toContain("NonExistent");
  });
}); 