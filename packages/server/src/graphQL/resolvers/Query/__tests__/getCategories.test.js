const getCategories = require("../getCategories");
const { Item } = require("../../../../database/schemas");

describe("getCategories resolver", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
  });

  it("should return empty array when no items exist", async () => {
    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved categories"
    );
  });

  it("should return distinct categories from items", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
      { name: "Broccoli", category: "Vegetables" },
      { name: "Milk", category: "Dairy" },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(3);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).toContain("Dairy");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully retrieved categories"
    );
  });

  it("should filter out empty and whitespace-only categories", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Unknown1", category: "" }, // empty
      { name: "Unknown2", category: "   " }, // whitespace only
      { name: "Carrot", category: "Vegetables" },
      { name: "Unknown3", category: "\t\n" }, // tabs and newlines
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).not.toContain("");
    expect(result).not.toContain("   ");
    expect(result).not.toContain("\t\n");
  });

  it("should filter out null categories", async () => {
    // Create items with null category directly in database
    await Item.collection.insertMany([
      { name: "Apple", category: null },
      { name: "Banana", category: "Fruits" },
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).not.toContain(null);
  });

  it("should handle items with no category field", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits" },
      { name: "Banana" }, // no category field
      { name: "Carrot", category: "Vegetables" },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
  });

  it("should handle large number of categories", async () => {
    const categories = [
      "Fruits",
      "Vegetables",
      "Dairy",
      "Meat",
      "Grains",
      "Beverages",
      "Snacks",
      "Frozen",
      "Canned",
      "Bakery",
    ];

    const items = categories.map((category, index) => ({
      name: `Item${index}`,
      category,
    }));

    await Item.create(items);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(10);
    categories.forEach((category) => {
      expect(result).toContain(category);
    });
  });

  it("should handle special characters in categories", async () => {
    await Item.create([
      { name: "Item1", category: "Café & Bistro" },
      { name: "Item2", category: "Bücher & Zeitschriften" },
      { name: "Item3", category: "Niños & Bebés" },
      { name: "Item4", category: "Électronique" },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(4);
    expect(result).toContain("Café & Bistro");
    expect(result).toContain("Bücher & Zeitschriften");
    expect(result).toContain("Niños & Bebés");
    expect(result).toContain("Électronique");
  });

  it("should handle very long category names", async () => {
    const longCategory = "A".repeat(100);

    await Item.create([
      { name: "Item1", category: "Short" },
      { name: "Item2", category: longCategory },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Short");
    expect(result).toContain(longCategory);
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();

    // Mock Item.distinct to throw an error
    const originalDistinct = Item.distinct;
    Item.distinct = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(getCategories(null, {}, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    Item.distinct = originalDistinct;
  });

  it("should return categories in consistent order", async () => {
    await Item.create([
      { name: "Item1", category: "Z-Category" },
      { name: "Item2", category: "A-Category" },
      { name: "Item3", category: "M-Category" },
    ]);

    const context = global.createMockContext();
    const result1 = await getCategories(null, {}, context);
    const result2 = await getCategories(null, {}, context);

    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(3);
  });

  it("should handle mixed case categories", async () => {
    await Item.create([
      { name: "Item1", category: "fruits" },
      { name: "Item2", category: "VEGETABLES" },
      { name: "Item3", category: "Dairy Products" },
    ]);

    const context = global.createMockContext();
    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(3);
    expect(result).toContain("fruits");
    expect(result).toContain("VEGETABLES");
    expect(result).toContain("Dairy Products");
  });
});
