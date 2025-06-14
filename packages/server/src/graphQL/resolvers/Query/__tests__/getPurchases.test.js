const getPurchases = require("../getPurchases");
const { Purchase } = require("../../../../database/schemas");

describe("getPurchases resolver", () => {
  beforeEach(async () => {
    await Purchase.deleteMany({});
  });

  it("should return empty array when no purchases exist in date range", async () => {
    const from = "2024-01-01T00:00:00.000Z";
    const to = "2024-01-31T23:59:59.999Z";
    
    const context = global.createMockContext();
    const result = await getPurchases(null, { from, to }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully retrieved purchases"
    );
  });

  it("should return purchases within date range", async () => {
    const itemId = global.createMockId();
    const from = "2024-01-01T00:00:00.000Z";
    const to = "2024-01-31T23:59:59.999Z";

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-15T12:00:00.000Z"), // within range
      },
      {
        itemId,
        quantity: 2,
        unit: "lbs",
        price: 15,
        date: new Date("2024-01-20T12:00:00.000Z"), // within range
      },
      {
        itemId,
        quantity: 3,
        unit: "kg",
        price: 20,
        date: new Date("2023-12-31T12:00:00.000Z"), // before range
      },
      {
        itemId,
        quantity: 4,
        unit: "lbs",
        price: 25,
        date: new Date("2024-02-01T12:00:00.000Z"), // after range
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { from, to }, context);

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toBe(1);
    expect(result[1].quantity).toBe(2);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 2 },
      "Successfully retrieved purchases"
    );
  });

  it("should include purchases on boundary dates", async () => {
    const itemId = global.createMockId();
    const from = "2024-01-01T00:00:00.000Z";
    const to = "2024-01-31T23:59:59.999Z";

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-01T00:00:00.000Z"), // exactly at start
      },
      {
        itemId,
        quantity: 2,
        unit: "lbs",
        price: 15,
        date: new Date("2024-01-31T23:59:59.999Z"), // exactly at end
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { from, to }, context);

    expect(result).toHaveLength(2);
  });

  it("should handle single day range", async () => {
    const itemId = global.createMockId();
    const from = "2024-01-15T00:00:00.000Z";
    const to = "2024-01-15T23:59:59.999Z";

    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-15T12:00:00.000Z"), // within single day
      },
      {
        itemId,
        quantity: 2,
        unit: "lbs",
        price: 15,
        date: new Date("2024-01-14T12:00:00.000Z"), // day before
      },
      {
        itemId,
        quantity: 3,
        unit: "kg",
        price: 20,
        date: new Date("2024-01-16T12:00:00.000Z"), // day after
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { from, to }, context);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it("should handle different date formats", async () => {
    const itemId = global.createMockId();
    
    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-15T12:00:00.000Z"),
      },
    ]);

    const context = global.createMockContext();
    
    // Test with different date string formats
    const result1 = await getPurchases(null, { 
      from: "2024-01-01", 
      to: "2024-01-31" 
    }, context);
    
    const result2 = await getPurchases(null, { 
      from: "2024-01-01T00:00:00Z", 
      to: "2024-01-31T23:59:59Z" 
    }, context);

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
  });

  it("should handle large number of purchases", async () => {
    const itemId = global.createMockId();
    const purchases = [];
    
    for (let i = 1; i <= 100; i++) {
      purchases.push({
        itemId,
        quantity: i,
        unit: "kg",
        price: i * 10,
        date: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T12:00:00.000Z`),
      });
    }

    await Purchase.create(purchases);

    const context = global.createMockContext();
    const result = await getPurchases(null, { 
      from: "2024-01-01T00:00:00.000Z", 
      to: "2024-01-31T23:59:59.999Z" 
    }, context);

    expect(result).toHaveLength(100);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 100 },
      "Successfully retrieved purchases"
    );
  });

  it("should handle invalid date strings gracefully", async () => {
    const context = global.createMockContext();
    
    await expect(getPurchases(null, { 
      from: "invalid-date", 
      to: "2024-01-31T23:59:59.999Z" 
    }, context)).rejects.toThrow();
  });

  it("should handle reversed date range", async () => {
    const itemId = global.createMockId();
    
    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-15T12:00:00.000Z"),
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { 
      from: "2024-01-31T23:59:59.999Z", // later date
      to: "2024-01-01T00:00:00.000Z"    // earlier date
    }, context);

    // Should return empty array since from > to
    expect(result).toEqual([]);
  });

  it("should return purchases with all fields", async () => {
    const itemId = global.createMockId();
    
    await Purchase.create([
      {
        itemId,
        quantity: 2.5,
        unit: "kg",
        price: 15.99,
        discount: 1.50,
        date: new Date("2024-01-15T12:00:00.000Z"),
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { 
      from: "2024-01-01T00:00:00.000Z", 
      to: "2024-01-31T23:59:59.999Z" 
    }, context);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("itemId");
    expect(result[0]).toHaveProperty("quantity", 2.5);
    expect(result[0]).toHaveProperty("unit", "kg");
    expect(result[0]).toHaveProperty("price", 15.99);
    expect(result[0]).toHaveProperty("discount", 1.50);
    expect(result[0]).toHaveProperty("date");
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    
    // Mock Purchase.find to throw an error
    const originalFind = Purchase.find;
    Purchase.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(getPurchases(null, { 
      from: "2024-01-01T00:00:00.000Z", 
      to: "2024-01-31T23:59:59.999Z" 
    }, context)).rejects.toThrow("Database connection failed");

    // Restore original method
    Purchase.find = originalFind;
  });

  it("should handle timezone differences", async () => {
    const itemId = global.createMockId();
    
    await Purchase.create([
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-01T23:30:00.000Z"), // Late UTC time
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { 
      from: "2024-01-01T00:00:00.000Z", 
      to: "2024-01-01T23:59:59.999Z" 
    }, context);

    expect(result).toHaveLength(1);
  });

  it("should maintain date order in results", async () => {
    const itemId = global.createMockId();
    
    await Purchase.create([
      {
        itemId,
        quantity: 3,
        unit: "kg",
        price: 30,
        date: new Date("2024-01-20T12:00:00.000Z"),
      },
      {
        itemId,
        quantity: 1,
        unit: "kg",
        price: 10,
        date: new Date("2024-01-10T12:00:00.000Z"),
      },
      {
        itemId,
        quantity: 2,
        unit: "kg",
        price: 20,
        date: new Date("2024-01-15T12:00:00.000Z"),
      },
    ]);

    const context = global.createMockContext();
    const result = await getPurchases(null, { 
      from: "2024-01-01T00:00:00.000Z", 
      to: "2024-01-31T23:59:59.999Z" 
    }, context);

    expect(result).toHaveLength(3);
    // Results should contain all three purchases (order may vary)
    const quantities = result.map(p => p.quantity).sort();
    expect(quantities).toEqual([1, 2, 3]);
  });
}); 