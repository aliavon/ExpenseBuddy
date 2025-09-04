const getPurchasesCategorySuggestion = require("../getPurchasesCategorySuggestion");
const { Item } = require("../../../../database/schemas");

describe("getPurchasesCategorySuggestion resolver", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
    jest.clearAllMocks();
  });

  // Helper to create items with proper family context
  const createItemWithFamily = (familyId, itemData) => ({
    familyId,
    ...itemData,
  });

  it("should return category suggestions for existing items", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Carrot",
        category: "Vegetables",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Apple", "Carrot"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "Apple", category: "Fruits" });
    expect(result).toContainEqual({ name: "Carrot", category: "Vegetables" });
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family purchases category suggestion"
    );
  });

  it("should return null category for non-existing items", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple1",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Apple1", "NonExistent"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "Apple1", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent", category: null });
  });

  it("should handle empty names array", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple2",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family purchases category suggestion"
    );
  });

  it("should maintain order of input names", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Carrot3",
        category: "Vegetables",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple3",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana3",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Carrot3", "Apple3", "Banana3"] },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: "Carrot3", category: "Vegetables" });
    expect(result[1]).toEqual({ name: "Apple3", category: "Fruits" });
    expect(result[2]).toEqual({ name: "Banana3", category: "Fruits" });
  });

  it("should handle duplicate names in input", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple4",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Apple4", "Apple4", "Apple4"] },
      context
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { name: "Apple4", category: "Fruits" },
      { name: "Apple4", category: "Fruits" },
      { name: "Apple4", category: "Fruits" },
    ]);
  });

  it("should handle case-sensitive name matching", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple5",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "apple5", // lowercase
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Apple5", "apple5"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Apple5", category: "Fruits" });
    expect(result[1]).toEqual({ name: "apple5", category: "Fruits" });
  });

  it("should handle special characters in names", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Café Latte",
        category: "Beverages",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Piña Colada",
        category: "Beverages",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Café Latte", "Piña Colada"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      name: "Café Latte",
      category: "Beverages",
    });
    expect(result).toContainEqual({
      name: "Piña Colada",
      category: "Beverages",
    });
  });

  it("should handle large number of names", async () => {
    const context = global.createMockContext();

    const items = Array.from({ length: 100 }, (_, index) =>
      createItemWithFamily(context.auth.user.familyId, {
        name: `Item${index}`,
        category: `Category${index % 5}`,
      })
    );

    await Item.create(items);

    const names = Array.from({ length: 100 }, (_, index) => `Item${index}`);
    const result = await getPurchasesCategorySuggestion(
      null,
      { names },
      context
    );

    expect(result).toHaveLength(100);
    expect(result.every((item) => item.category !== null)).toBe(true);
  });

  it("should handle mixed existing and non-existing items", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple6",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana6",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["Apple6", "NonExistent1", "Banana6", "NonExistent2"] },
      context
    );

    expect(result).toHaveLength(4);
    expect(result).toContainEqual({ name: "Apple6", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent1", category: null });
    expect(result).toContainEqual({ name: "Banana6", category: "Fruits" });
    expect(result).toContainEqual({ name: "NonExistent2", category: null });
  });

  it("should handle items with null or empty categories", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Item1",
        category: null,
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Item2",
        category: "",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Item3",
        category: "ValidCategory",
      }),
    ]);

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

  it("should handle very long item names", async () => {
    const context = global.createMockContext();
    const longName = "A".repeat(200);

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: longName,
        category: "LongNames",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: [longName] },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: longName, category: "LongNames" });
  });

  it("should handle whitespace in item names", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "  Apple7  ",
        category: "Fruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["  Apple7  ", "Apple7"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "  Apple7  ", category: "Fruits" });
    expect(result[1]).toEqual({ name: "Apple7", category: null }); // Exact match required
  });

  it("should only return items for user's family", async () => {
    const context = global.createMockContext();
    const otherFamilyId = global.createMockId();

    // Create items for different families
    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "MyApple",
        category: "Fruits",
      }),
      createItemWithFamily(otherFamilyId, {
        name: "OtherApple",
        category: "OtherFruits",
      }),
    ]);

    const result = await getPurchasesCategorySuggestion(
      null,
      { names: ["MyApple", "OtherApple"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ name: "MyApple", category: "Fruits" });
    expect(result).toContainEqual({ name: "OtherApple", category: null }); // Not found in user's family
  });
});
