const addItems = require("../addItems");
const { Item } = require("../../../../database/schemas");

describe("addItems mutation", () => {
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

  it("should add single item successfully", async () => {
    const context = global.createMockContext();
    const items = [createItemData({ name: "Apple", category: "Fruits" })];

    const result = await addItems(null, { items }, context);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
    expect(result[0].category).toBe("Fruits");
    expect(result[0]._id).toBeDefined();
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully added family items"
    );
  });

  it("should add multiple items successfully", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({ name: "Apple", category: "Fruits" }),
      createItemData({ name: "Bread", category: "Bakery" }),
      createItemData({ name: "Milk", category: "Dairy" }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Apple");
    expect(result[1].name).toBe("Bread");
    expect(result[2].name).toBe("Milk");
    expect(result[0].category).toBe("Fruits");
    expect(result[1].category).toBe("Bakery");
    expect(result[2].category).toBe("Dairy");
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 3,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully added family items"
    );
  });

  it("should handle empty items array", async () => {
    const context = global.createMockContext();

    const result = await addItems(null, { items: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully added family items"
    );
  });

  it("should add items with empty category", async () => {
    const context = global.createMockContext();
    const items = [createItemData({ name: "Generic Item", category: "" })];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("Generic Item");
    expect(result[0].category).toBe("");
  });

  it("should add items without category field", async () => {
    const context = global.createMockContext();
    const items = [{ name: "No Category Item" }];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("No Category Item");
    expect(result[0].category).toBe(""); // default value
  });

  it("should handle special characters in item data", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({
        name: "Café & Croissant",
        category: "Boulangerie - très spécial!",
      }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("Café & Croissant");
    expect(result[0].category).toBe("Boulangerie - très spécial!");
  });

  it("should handle unicode characters", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({
        name: "苹果",
        category: "水果",
      }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("苹果");
    expect(result[0].category).toBe("水果");
  });

  it("should handle emoji in item data", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({
        name: "Apple 🍎",
        category: "Fruits 🍓",
      }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("Apple 🍎");
    expect(result[0].category).toBe("Fruits 🍓");
  });

  it("should handle large batch insertion", async () => {
    const context = global.createMockContext();
    const items = [];
    for (let i = 1; i <= 50; i++) {
      items.push(
        createItemData({
          name: `Item ${i}`,
          category: `Category ${i % 5}`, // 5 different categories
        })
      );
    }

    const result = await addItems(null, { items }, context);

    expect(result).toHaveLength(50);
    expect(result[0].name).toBe("Item 1");
    expect(result[49].name).toBe("Item 50");
    expect(context.logger.info).toHaveBeenCalledWith(
      {
        count: 50,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully added family items"
    );
  });

  it("should persist items in database", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({ name: "Persistent Apple", category: "Fruits" }),
      createItemData({ name: "Persistent Bread", category: "Bakery" }),
    ];

    await addItems(null, { items }, context);

    // Verify items were persisted
    const persistedItems = await Item.find({});
    expect(persistedItems).toHaveLength(2);
    expect(
      persistedItems.find((item) => item.name === "Persistent Apple")
    ).toBeDefined();
    expect(
      persistedItems.find((item) => item.name === "Persistent Bread")
    ).toBeDefined();
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    const items = [createItemData({ name: "Test Item" })];

    // Mock Item.insertMany to throw an error
    const originalInsertMany = Item.insertMany;
    Item.insertMany = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(addItems(null, { items }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    Item.insertMany = originalInsertMany;
  });

  it("should preserve order of items", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({ name: "First Item" }),
      createItemData({ name: "Second Item" }),
      createItemData({ name: "Third Item" }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("First Item");
    expect(result[1].name).toBe("Second Item");
    expect(result[2].name).toBe("Third Item");
  });

  it("should handle very long item names and categories", async () => {
    const context = global.createMockContext();
    const longName = "A".repeat(200);
    const longCategory = "B".repeat(200);
    const items = [createItemData({ name: longName, category: longCategory })];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe(longName);
    expect(result[0].category).toBe(longCategory);
  });

  it("should handle duplicate item names in different families", async () => {
    const context1 = global.createMockContext();
    const context2 = global.createMockContext(); // Different family

    // Create item with same name in family 1
    const result1 = await addItems(
      null,
      {
        items: [{ name: "Duplicate Item", category: "Category 1" }],
      },
      context1
    );

    // Should be able to create item with same name in family 2
    const result2 = await addItems(
      null,
      {
        items: [{ name: "Duplicate Item", category: "Category 2" }],
      },
      context2
    );

    expect(result1[0].name).toBe("Duplicate Item");
    expect(result2[0].name).toBe("Duplicate Item");
    expect(result1[0].familyId.toString()).toBe(context1.auth.user.familyId);
    expect(result2[0].familyId.toString()).toBe(context2.auth.user.familyId);
    expect(result1[0].familyId.toString()).not.toBe(
      result2[0].familyId.toString()
    );
  });

  it("should handle duplicate item names in same family", async () => {
    const context = global.createMockContext();

    // First item
    await addItems(
      null,
      { items: [{ name: "Same Name", category: "Category 1" }] },
      context
    );

    // Try to create another item with same name in same family - should fail
    await expect(
      addItems(
        null,
        {
          items: [{ name: "Same Name", category: "Category 2" }],
        },
        context
      )
    ).rejects.toThrow();
  });

  it("should handle null category values", async () => {
    const context = global.createMockContext();
    const items = [
      createItemData({ name: "Null Category Item", category: null }),
    ];

    const result = await addItems(null, { items }, context);

    expect(result[0].name).toBe("Null Category Item");
    expect(result[0].category).toBeNull();
  });

  it("should return items with MongoDB ObjectIds", async () => {
    const context = global.createMockContext();
    const items = [createItemData({ name: "ID Test Item" })];

    const result = await addItems(null, { items }, context);

    expect(result[0]._id).toBeDefined();
    expect(result[0]._id.toString()).toMatch(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId format
  });

  it("should handle mixed valid data", async () => {
    const context = global.createMockContext();
    const items = [
      { name: "Item with category", category: "Food" },
      { name: "Item without category" },
      { name: "Item with empty category", category: "" },
      { name: "Item with null category", category: null },
    ];

    const result = await addItems(null, { items }, context);

    expect(result).toHaveLength(4);
    expect(result[0].category).toBe("Food");
    expect(result[1].category).toBe(""); // default
    expect(result[2].category).toBe("");
    expect(result[3].category).toBeNull();
  });
});
