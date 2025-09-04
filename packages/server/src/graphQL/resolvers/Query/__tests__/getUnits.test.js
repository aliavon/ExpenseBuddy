const getUnits = require("../getUnits");
const { Purchase } = require("../../../../database/schemas");

describe("getUnits resolver", () => {
  beforeEach(async () => {
    await Purchase.deleteMany({});
  });

  it("should return empty array when no purchases exist", async () => {
    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved units"
    );
  });

  it("should return distinct units from purchases", async () => {
    const itemId = global.createMockId();

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date(),
      },
      {
        itemId,
        quantity: 2,
        unit: "lbs",
        price: 15,
        date: new Date(),
      },
      {
        itemId,
        quantity: 3,
        unit: "kg", // duplicate
        price: 20,
        date: new Date(),
      },
    ]);

    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("kg");
    expect(result).toContain("lbs");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully retrieved units"
    );
  });

  it("should filter out empty and whitespace-only units", async () => {
    const itemId = global.createMockId();

    // Create purchases with valid units first
    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date(),
      },
      {
        itemId,
        quantity: 4,
        unit: "lbs",
        price: 25,
        date: new Date(),
      },
    ]);

    // Insert invalid units directly to bypass validation
    await Purchase.collection.insertMany([
      {
        itemId,
        quantity: 2,
        unit: "", // empty
        price: 15,
        date: new Date(),
      },
      {
        itemId,
        quantity: 3,
        unit: "   ", // whitespace only
        price: 20,
        date: new Date(),
      },
    ]);

    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toHaveLength(2);
    expect(result).toContain("kg");
    expect(result).toContain("lbs");
    expect(result).not.toContain("");
    expect(result).not.toContain("   ");
  });

  it("should filter out null units", async () => {
    const itemId = global.createMockId();

    // Create purchase with null unit directly in database
    await Purchase.collection.insertMany([
      {
        itemId,
        quantity: 1,
        unit: null,
        price: 10,
        date: new Date(),
      },
      {
        itemId,
        quantity: 2,
        unit: "kg",
        price: 15,
        date: new Date(),
      },
    ]);

    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toHaveLength(1);
    expect(result).toContain("kg");
    expect(result).not.toContain(null);
  });

  it("should handle large number of units", async () => {
    const itemId = global.createMockId();
    const units = ["kg", "lbs", "oz", "g", "ton", "piece", "box", "pack"];

    const purchases = units.map((unit, index) => ({
      itemId,
      quantity: index + 1,
      unit,
      price: (index + 1) * 10,
      date: new Date(),
    }));

    await Purchase.create(purchases);

    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toHaveLength(8);
    units.forEach((unit) => {
      expect(result).toContain(unit);
    });
  });

  it("should handle special characters in units", async () => {
    const itemId = global.createMockId();

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "m²",
        price: 10,
        date: new Date(),
      },
      {
        itemId,
        quantity: 2,
        unit: "m³",
        price: 15,
        date: new Date(),
      },
      {
        itemId,
        quantity: 3,
        unit: "°C",
        price: 20,
        date: new Date(),
      },
    ]);

    const context = global.createMockContext();
    const result = await getUnits(null, {}, context);

    expect(result).toHaveLength(3);
    expect(result).toContain("m²");
    expect(result).toContain("m³");
    expect(result).toContain("°C");
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();

    // Mock Purchase.distinct to throw an error
    const originalDistinct = Purchase.distinct;
    Purchase.distinct = jest
      .fn()
      .mockRejectedValue(new Error("Database error"));

    await expect(getUnits(null, {}, context)).rejects.toThrow("Database error");

    // Restore original method
    Purchase.distinct = originalDistinct;
  });

  it("should return units in consistent order", async () => {
    const itemId = global.createMockId();

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "z-unit",
        price: 10,
        date: new Date(),
      },
      {
        itemId,
        quantity: 2,
        unit: "a-unit",
        price: 15,
        date: new Date(),
      },
      {
        itemId,
        quantity: 3,
        unit: "m-unit",
        price: 20,
        date: new Date(),
      },
    ]);

    const context = global.createMockContext();
    const result1 = await getUnits(null, {}, context);
    const result2 = await getUnits(null, {}, context);

    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(3);
  });
});
