const addPurchases = require("../addPurchases");
const { Purchase } = require("../../../../database/schemas");

describe("addPurchases mutation", () => {
  beforeEach(async () => {
    await Purchase.deleteMany({});
  });

  const createPurchaseData = (overrides = {}) => ({
    itemId: global.createMockId(),
    quantity: 2,
    unit: "kg",
    price: 15.99,
    date: new Date("2024-01-15"),
    ...overrides,
  });

  it("should add single purchase successfully", async () => {
    const purchaseData = createPurchaseData();
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].itemId.toString()).toBe(purchaseData.itemId.toString());
    expect(result[0].quantity).toBe(purchaseData.quantity);
    expect(result[0].unit).toBe(purchaseData.unit);
    expect(result[0].price).toBe(purchaseData.price);
    expect(result[0]).toHaveProperty("_id");
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully added purchases"
    );
  });

  it("should add multiple purchases successfully", async () => {
    const purchases = [
      createPurchaseData({ quantity: 1, price: 10.50 }),
      createPurchaseData({ quantity: 3, price: 25.99 }),
      createPurchaseData({ quantity: 2, price: 18.75 }),
    ];
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].quantity).toBe(1);
    expect(result[1].quantity).toBe(3);
    expect(result[2].quantity).toBe(2);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully added purchases"
    );
  });

  it("should handle empty purchases array", async () => {
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [] },
      context
    );

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully added purchases"
    );
  });

  it("should add purchases with all optional fields", async () => {
    const purchaseData = createPurchaseData({
      discount: 2.50,
      note: "Fresh organic apples",
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result).toHaveLength(1);
    expect(result[0].discount).toBe(2.50);
    expect(result[0].note).toBe("Fresh organic apples");
  });

  it("should add purchases with different item IDs", async () => {
    const purchases = [
      createPurchaseData({ itemId: global.createMockId() }),
      createPurchaseData({ itemId: global.createMockId() }),
      createPurchaseData({ itemId: global.createMockId() }),
    ];
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result).toHaveLength(3);
    const itemIds = result.map(p => p.itemId.toString());
    const uniqueItemIds = [...new Set(itemIds)];
    expect(uniqueItemIds).toHaveLength(3);
  });

  it("should handle purchases with decimal quantities", async () => {
    const purchaseData = createPurchaseData({
      quantity: 2.5,
      unit: "kg",
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result[0].quantity).toBe(2.5);
  });

  it("should handle purchases with different units", async () => {
    const purchases = [
      createPurchaseData({ unit: "kg" }),
      createPurchaseData({ unit: "lbs" }),
      createPurchaseData({ unit: "pieces" }),
      createPurchaseData({ unit: "liters" }),
    ];
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result).toHaveLength(4);
    expect(result.map(p => p.unit)).toEqual(["kg", "lbs", "pieces", "liters"]);
  });

  it("should handle purchases with different dates", async () => {
    const purchases = [
      createPurchaseData({ date: new Date("2024-01-01") }),
      createPurchaseData({ date: new Date("2024-02-15") }),
      createPurchaseData({ date: new Date("2024-03-30") }),
    ];
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date("2024-01-01"));
    expect(result[1].date).toEqual(new Date("2024-02-15"));
    expect(result[2].date).toEqual(new Date("2024-03-30"));
  });

  it("should handle large batch of purchases", async () => {
    const purchases = [];
    for (let i = 1; i <= 50; i++) {
      purchases.push(createPurchaseData({
        quantity: i,
        price: i * 1.5,
      }));
    }
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result).toHaveLength(50);
    expect(result[0].quantity).toBe(1);
    expect(result[49].quantity).toBe(50);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 50 },
      "Successfully added purchases"
    );
  });

  it("should handle purchases with zero discount", async () => {
    const purchaseData = createPurchaseData({
      discount: 0,
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result[0].discount).toBe(0);
  });

  it("should handle purchases with special characters in note", async () => {
    const purchaseData = createPurchaseData({
      note: "Café au lait & croissants - très délicieux! 🥐☕",
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result[0].note).toBe("Café au lait & croissants - très délicieux! 🥐☕");
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    
    // Mock Purchase.insertMany to throw an error
    const originalInsertMany = Purchase.insertMany;
    Purchase.insertMany = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    await expect(addPurchases(
      null,
      { purchases: [createPurchaseData()] },
      context
    )).rejects.toThrow("Database connection failed");

    // Restore original method
    Purchase.insertMany = originalInsertMany;
  });

  it("should preserve insertion order", async () => {
    const purchases = [
      createPurchaseData({ quantity: 1, price: 10 }),
      createPurchaseData({ quantity: 2, price: 20 }),
      createPurchaseData({ quantity: 3, price: 30 }),
    ];
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases },
      context
    );

    expect(result[0].quantity).toBe(1);
    expect(result[1].quantity).toBe(2);
    expect(result[2].quantity).toBe(3);
  });

  it("should handle purchases with very high prices", async () => {
    const purchaseData = createPurchaseData({
      price: 999999.99,
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result[0].price).toBe(999999.99);
  });

  it("should handle purchases with very small quantities", async () => {
    const purchaseData = createPurchaseData({
      quantity: 0.001,
    });
    const context = global.createMockContext();

    const result = await addPurchases(
      null,
      { purchases: [purchaseData] },
      context
    );

    expect(result[0].quantity).toBe(0.001);
  });
}); 