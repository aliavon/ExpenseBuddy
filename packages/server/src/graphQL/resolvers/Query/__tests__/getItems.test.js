const getItems = require("../getItems");
const { Item } = require("../../../../database/schemas");

describe("getItems resolver", () => {
  beforeEach(async () => {
    await Item.deleteMany({});
    jest.clearAllMocks();
  });

  // Helper to create items with proper family context
  const createItemWithFamily = (familyId, itemData) => ({
    familyId,
    ...itemData,
  });

  it("should return all items when no filters provided", async () => {
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

    const result = await getItems(null, {}, context);

    expect(result).toHaveLength(3);
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 3,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family items"
    );
  });

  it("should filter items by names", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple1",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana1",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Carrot1",
        category: "Vegetables",
      }),
    ]);

    const result = await getItems(
      null,
      { names: ["Apple1", "Carrot1"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.name)).toContain("Apple1");
    expect(result.map((item) => item.name)).toContain("Carrot1");
    expect(result.map((item) => item.name)).not.toContain("Banana1");
  });

  it("should filter items by category", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple2",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana2",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Carrot2",
        category: "Vegetables",
      }),
    ]);

    const result = await getItems(null, { category: "Fruits" }, context);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.name)).toContain("Apple2");
    expect(result.map((item) => item.name)).toContain("Banana2");
    expect(result.map((item) => item.category)).toEqual(["Fruits", "Fruits"]);
  });

  it("should filter items by both names and category", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple3",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana3",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple4",
        category: "Vegetables",
      }),
    ]);

    const result = await getItems(
      null,
      { names: ["Apple3", "Apple4"], category: "Fruits" },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple3");
    expect(result[0].category).toBe("Fruits");
  });

  it("should return empty array when names filter matches nothing", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple5",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana5",
        category: "Fruits",
      }),
    ]);

    const result = await getItems(null, { names: ["NonExistent"] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully retrieved family items"
    );
  });

  it("should handle empty names array", async () => {
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

    const result = await getItems(null, { names: [] }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle null names array", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple7",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana7",
        category: "Fruits",
      }),
    ]);

    const result = await getItems(null, { names: null }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle empty category string", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple8",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana8",
        category: "Fruits",
      }),
    ]);

    const result = await getItems(null, { category: "" }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle whitespace-only category string", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple9",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana9",
        category: "Fruits",
      }),
    ]);

    const result = await getItems(null, { category: "   " }, context);

    expect(result).toHaveLength(2); // Should return all items
  });

  it("should handle case-sensitive category matching", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple10",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple11",
        category: "fruits", // lowercase
      }),
    ]);

    const result = await getItems(null, { category: "Fruits" }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple10");
  });

  it("should handle case-sensitive name matching", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple12",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "apple12", // lowercase
        category: "Fruits",
      }),
    ]);

    const result = await getItems(null, { names: ["Apple12"] }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple12");
  });

  it("should handle large number of items", async () => {
    const context = global.createMockContext();

    const items = Array.from({ length: 100 }, (_, index) =>
      createItemWithFamily(context.auth.user.familyId, {
        name: `Item${index}`,
        category: `Category${index % 10}`,
      })
    );

    await Item.create(items);

    const result = await getItems(null, { category: "Category1" }, context);

    expect(result).toHaveLength(10); // Items 1, 11, 21, ..., 91
  });

  it("should handle special characters in names and categories", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Café Latte",
        category: "Beverages & Drinks",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Piña Colada",
        category: "Beverages & Drinks",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Regular Item",
        category: "Regular Category",
      }),
    ]);

    const result1 = await getItems(null, { names: ["Café Latte"] }, context);
    const result2 = await getItems(
      null,
      { category: "Beverages & Drinks" },
      context
    );

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(2);
  });

  it("should return items with all fields", async () => {
    const context = global.createMockContext();

    const itemData = createItemWithFamily(context.auth.user.familyId, {
      name: "Test Item",
      category: "Test Category",
    });

    await Item.create(itemData);

    const result = await getItems(null, {}, context);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Test Item");
    expect(result[0]).toHaveProperty("category", "Test Category");
    expect(result[0]).toHaveProperty("_id");
  });

  it("should handle partial name matches in array", async () => {
    const context = global.createMockContext();

    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "Apple13",
        category: "Fruits",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Carrot13",
        category: "Vegetables",
      }),
      createItemWithFamily(context.auth.user.familyId, {
        name: "Banana13",
        category: "Fruits",
      }),
    ]);

    const result = await getItems(
      null,
      { names: ["Apple13", "Carrot13", "NonExistent"] },
      context
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.name)).toContain("Apple13");
    expect(result.map((item) => item.name)).toContain("Carrot13");
    expect(result.map((item) => item.name)).not.toContain("NonExistent");
  });

  it("should only return items for user's family", async () => {
    const context = global.createMockContext();
    const otherFamilyId = global.createMockId();

    // Create items for different families
    await Item.create([
      createItemWithFamily(context.auth.user.familyId, {
        name: "My Family Item",
        category: "My Category",
      }),
      createItemWithFamily(otherFamilyId, {
        name: "Other Family Item",
        category: "Other Category",
      }),
    ]);

    const result = await getItems(null, {}, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My Family Item");
  });
});
