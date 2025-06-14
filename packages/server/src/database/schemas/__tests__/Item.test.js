const Item = require("../Item");

describe("Item Schema", () => {
  it("should create item with required fields", async () => {
    const itemData = {
      name: "Test Item",
      category: "Electronics",
    };

    const item = new Item(itemData);
    const savedItem = await item.save();

    expect(savedItem.name).toBe(itemData.name);
    expect(savedItem.category).toBe(itemData.category);
    expect(savedItem._id).toBeDefined();
  });

  it("should create item with default empty category", async () => {
    const itemData = { name: "Test Item" };
    const item = new Item(itemData);
    const savedItem = await item.save();

    expect(savedItem.category).toBe("");
  });

  it("should fail validation without name", async () => {
    const item = new Item({ category: "Electronics" });
    
    let error;
    try {
      await item.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("should find items by category", async () => {
    await Item.create([
      { name: "Item 1", category: "Electronics" },
      { name: "Item 2", category: "Books" },
      { name: "Item 3", category: "Electronics" },
    ]);

    const electronics = await Item.find({ category: "Electronics" });
    expect(electronics).toHaveLength(2);
  });

  it("should find items by name array", async () => {
    await Item.create([
      { name: "Item 1", category: "Electronics" },
      { name: "Item 2", category: "Books" },
      { name: "Item 3", category: "Electronics" },
    ]);

    const items = await Item.find({ name: { $in: ["Item 1", "Item 3"] } });
    expect(items).toHaveLength(2);
  });
}); 