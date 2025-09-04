const Item = require("../Item");
const Family = require("../Family");
const User = require("../User");
const Currency = require("../Currency");

describe("Item Schema", () => {
  let testFamily;

  beforeEach(async () => {
    const testCurrency = await Currency.create({
      name: "US Dollar",
      code: "USD",
      symbol: "$",
    });

    const testUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
    });

    testFamily = await Family.create({
      name: "Test Family",
      ownerId: testUser._id,
      currency: testCurrency._id,
    });
  });

  it("should create item with required fields", async () => {
    const itemData = {
      familyId: testFamily._id,
      name: "Test Item",
      category: "Electronics",
    };

    const item = new Item(itemData);
    const savedItem = await item.save();

    expect(savedItem.familyId.toString()).toBe(testFamily._id.toString());
    expect(savedItem.name).toBe(itemData.name);
    expect(savedItem.category).toBe(itemData.category);
    expect(savedItem._id).toBeDefined();
  });

  it("should create item with default empty category", async () => {
    const itemData = { familyId: testFamily._id, name: "Test Item" };
    const item = new Item(itemData);
    const savedItem = await item.save();

    expect(savedItem.category).toBe("");
  });

  it("should fail validation without name", async () => {
    const item = new Item({
      familyId: testFamily._id,
      category: "Electronics",
    });

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
      { familyId: testFamily._id, name: "Item 1", category: "Electronics" },
      { familyId: testFamily._id, name: "Item 2", category: "Books" },
      { familyId: testFamily._id, name: "Item 3", category: "Electronics" },
    ]);

    const electronics = await Item.find({ category: "Electronics" });
    expect(electronics).toHaveLength(2);
  });

  it("should find items by name array", async () => {
    await Item.create([
      { familyId: testFamily._id, name: "Item 1", category: "Electronics" },
      { familyId: testFamily._id, name: "Item 2", category: "Books" },
      { familyId: testFamily._id, name: "Item 3", category: "Electronics" },
    ]);

    const items = await Item.find({ name: { $in: ["Item 1", "Item 3"] } });
    expect(items).toHaveLength(2);
  });
});
