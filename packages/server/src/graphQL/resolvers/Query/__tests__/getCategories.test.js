const getCategories = require("../getCategories");
const { Item } = require("../../../../database/schemas");
const mongoose = require("mongoose");

describe("getCategories resolver", () => {
  let testFamilyId;
  let context;

  beforeEach(async () => {
    await Item.deleteMany({});
    context = global.createMockContext();
    testFamilyId = new mongoose.Types.ObjectId(context.auth.user.familyId);
  });

  it("should return empty array when no items exist", async () => {
    const result = await getCategories(null, {}, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0, familyId: context.auth.user.familyId },
      "Successfully retrieved categories for family"
    );
  });

  it("should return distinct categories from items", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits", familyId: testFamilyId },
      { name: "Banana", category: "Fruits", familyId: testFamilyId },
      { name: "Carrot", category: "Vegetables", familyId: testFamilyId },
      { name: "Broccoli", category: "Vegetables", familyId: testFamilyId },
      { name: "Milk", category: "Dairy", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(3);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).toContain("Dairy");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3, familyId: context.auth.user.familyId },
      "Successfully retrieved categories for family"
    );
  });

  it("should filter out empty and whitespace-only categories", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits", familyId: testFamilyId },
      { name: "Unknown1", category: "", familyId: testFamilyId },
      { name: "Unknown2", category: "   ", familyId: testFamilyId },
      { name: "Carrot", category: "Vegetables", familyId: testFamilyId },
      { name: "Unknown3", category: "\t\n", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).not.toContain("");
    expect(result).not.toContain("   ");
    expect(result).not.toContain("\t\n");
  });

  it("should filter out null categories", async () => {
    await Item.collection.insertMany([
      { name: "Apple", category: null, familyId: testFamilyId },
      { name: "Banana", category: "Fruits", familyId: testFamilyId },
      { name: "Carrot", category: "Vegetables", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).not.toContain(null);
  });

  it("should handle items with no category field", async () => {
    await Item.create([
      { name: "Apple", category: "Fruits", familyId: testFamilyId },
      { name: "Banana", familyId: testFamilyId },
      { name: "Carrot", category: "Vegetables", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
  });

  it("should only return categories from user's family", async () => {
    const otherFamilyId = new mongoose.Types.ObjectId();

    await Item.create([
      { name: "Apple", category: "Fruits", familyId: testFamilyId },
      {
        name: "Banana",
        category: "OtherFamilyCategory",
        familyId: otherFamilyId,
      },
      { name: "Carrot", category: "Vegetables", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Fruits");
    expect(result).toContain("Vegetables");
    expect(result).not.toContain("OtherFamilyCategory");
  });

  it("should handle special characters in categories", async () => {
    await Item.create([
      { name: "Item1", category: "Café & Bistro", familyId: testFamilyId },
      {
        name: "Item2",
        category: "Bücher & Zeitschriften",
        familyId: testFamilyId,
      },
      { name: "Item3", category: "Niños & Bebés", familyId: testFamilyId },
      { name: "Item4", category: "Électronique", familyId: testFamilyId },
    ]);

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
      { name: "Item1", category: "Short", familyId: testFamilyId },
      { name: "Item2", category: longCategory, familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("Short");
    expect(result).toContain(longCategory);
  });

  it("should handle database errors gracefully", async () => {
    const originalDistinct = context.schemas.Item.distinct;
    context.schemas.Item.distinct = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(getCategories(null, {}, context)).rejects.toThrow(
      "Database connection failed"
    );

    context.schemas.Item.distinct = originalDistinct;
  });

  it("should return categories in consistent order", async () => {
    await Item.create([
      { name: "Item1", category: "Z-Category", familyId: testFamilyId },
      { name: "Item2", category: "A-Category", familyId: testFamilyId },
      { name: "Item3", category: "M-Category", familyId: testFamilyId },
    ]);

    const result1 = await getCategories(null, {}, context);
    const result2 = await getCategories(null, {}, context);

    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(3);
  });

  it("should handle mixed case categories", async () => {
    await Item.create([
      { name: "Item1", category: "fruits", familyId: testFamilyId },
      { name: "Item2", category: "VEGETABLES", familyId: testFamilyId },
      { name: "Item3", category: "Dairy Products", familyId: testFamilyId },
    ]);

    const result = await getCategories(null, {}, context);

    expect(result).toHaveLength(3);
    expect(result).toContain("fruits");
    expect(result).toContain("VEGETABLES");
    expect(result).toContain("Dairy Products");
  });

  it("should require authentication", async () => {
    const unauthContext = global.createMockContext({
      auth: null,
    });

    await expect(getCategories(null, {}, unauthContext)).rejects.toThrow();
  });
});
