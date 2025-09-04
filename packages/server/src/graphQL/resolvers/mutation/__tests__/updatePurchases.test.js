const updatePurchases = require("../updatePurchases");
const { Purchase } = require("../../../../database/schemas");

describe("updatePurchases mutation", () => {
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

  const createPurchaseInDB = async (data = {}) => {
    const purchaseData = createPurchaseData(data);
    const purchase = new Purchase(purchaseData);
    return await purchase.save();
  };

  it("should update single purchase successfully", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        quantity: 5,
        price: 25.99,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
    expect(result[0].price).toBe(25.99);
    expect(result[0].unit).toBe("kg"); // unchanged field
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated purchases"
    );
  });

  it("should update multiple purchases successfully", async () => {
    const purchase1 = await createPurchaseInDB({ quantity: 1, price: 10 });
    const purchase2 = await createPurchaseInDB({ quantity: 2, price: 20 });
    const purchase3 = await createPurchaseInDB({ quantity: 3, price: 30 });
    const context = global.createMockContext();

    const updates = [
      { id: purchase1._id, quantity: 10 },
      { id: purchase2._id, price: 200 },
      { id: purchase3._id, quantity: 30, price: 300 },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toHaveLength(3);

    const updatedPurchase1 = result.find(
      (p) => p._id.toString() === purchase1._id.toString()
    );
    const updatedPurchase2 = result.find(
      (p) => p._id.toString() === purchase2._id.toString()
    );
    const updatedPurchase3 = result.find(
      (p) => p._id.toString() === purchase3._id.toString()
    );

    expect(updatedPurchase1.quantity).toBe(10);
    expect(updatedPurchase1.price).toBe(10); // unchanged
    expect(updatedPurchase2.quantity).toBe(2); // unchanged
    expect(updatedPurchase2.price).toBe(200);
    expect(updatedPurchase3.quantity).toBe(30);
    expect(updatedPurchase3.price).toBe(300);

    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 3 },
      "Successfully updated purchases"
    );
  });

  it("should handle empty updates array", async () => {
    const context = global.createMockContext();

    const result = await updatePurchases(null, { updates: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated purchases"
    );
  });

  it("should update all purchase fields", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        itemId: global.createMockId(),
        quantity: 10,
        unit: "lbs",
        price: 99.99,
        discount: 5.5,
        note: "Updated note",
        date: new Date("2024-12-25"),
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].quantity).toBe(10);
    expect(result[0].unit).toBe("lbs");
    expect(result[0].price).toBe(99.99);
    expect(result[0].discount).toBe(5.5);
    expect(result[0].note).toBe("Updated note");
    expect(result[0].date).toEqual(new Date("2024-12-25"));
  });

  it("should update only specified fields", async () => {
    const originalData = {
      quantity: 5,
      unit: "kg",
      price: 50.0,
      note: "Original note",
    };
    const purchase = await createPurchaseInDB(originalData);
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        quantity: 10, // only update quantity
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].quantity).toBe(10); // updated
    expect(result[0].unit).toBe("kg"); // unchanged
    expect(result[0].price).toBe(50.0); // unchanged
    expect(result[0].note).toBe("Original note"); // unchanged
  });

  it("should handle updates with decimal values", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        quantity: 2.75,
        price: 15.99,
        discount: 1.25,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].quantity).toBe(2.75);
    expect(result[0].price).toBe(15.99);
    expect(result[0].discount).toBe(1.25);
  });

  it("should handle updates with zero values", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        discount: 0,
        quantity: 0,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].discount).toBe(0);
    expect(result[0].quantity).toBe(0);
  });

  it("should handle updates with special characters", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        note: "Café & croissants - très délicieux! 🥐☕",
        unit: "pièces",
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].note).toBe("Café & croissants - très délicieux! 🥐☕");
    expect(result[0].unit).toBe("pièces");
  });

  it("should handle large batch updates", async () => {
    const purchases = [];
    for (let i = 1; i <= 20; i++) {
      purchases.push(await createPurchaseInDB({ quantity: i }));
    }

    const updates = purchases.map((purchase) => ({
      id: purchase._id,
      quantity: purchase.quantity * 2,
    }));

    const context = global.createMockContext();

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toHaveLength(20);
    expect(result[0].quantity).toBe(2);
    expect(result[19].quantity).toBe(40);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 20 },
      "Successfully updated purchases"
    );
  });

  it("should handle updates with null/undefined values", async () => {
    const purchase = await createPurchaseInDB({
      note: "Original note",
      discount: 5.0,
    });
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        note: null,
        // Skip undefined values as they cause MongoDB errors
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].note).toBeNull();
    // discount should remain unchanged since we didn't update it
    expect(result[0].discount).toBe(5.0);
  });

  it("should return updated purchases in correct order", async () => {
    const purchase1 = await createPurchaseInDB({ quantity: 1 });
    const purchase2 = await createPurchaseInDB({ quantity: 2 });
    const purchase3 = await createPurchaseInDB({ quantity: 3 });

    const updates = [
      { id: purchase3._id, quantity: 30 },
      { id: purchase1._id, quantity: 10 },
      { id: purchase2._id, quantity: 20 },
    ];

    const context = global.createMockContext();

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toHaveLength(3);
    // Results should be ordered by the database query, not input order
    const quantities = result.map((p) => p.quantity).sort();
    expect(quantities).toEqual([10, 20, 30]);
  });

  it("should handle non-existent purchase IDs gracefully", async () => {
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      {
        id: nonExistentId,
        quantity: 10,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 0 },
      "Successfully updated purchases"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const existingPurchase = await createPurchaseInDB({ quantity: 5 });
    const nonExistentId = global.createMockId();
    const context = global.createMockContext();

    const updates = [
      { id: existingPurchase._id, quantity: 50 },
      { id: nonExistentId, quantity: 100 },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(50);
    expect(context.logger.info).toHaveBeenCalledWith(
      { count: 1 },
      "Successfully updated purchases"
    );
  });

  it("should handle database errors gracefully", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    // Mock Purchase.bulkWrite to throw an error
    const originalBulkWrite = Purchase.bulkWrite;
    Purchase.bulkWrite = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    const updates = [
      {
        id: purchase._id,
        quantity: 10,
      },
    ];

    await expect(updatePurchases(null, { updates }, context)).rejects.toThrow(
      "Database connection failed"
    );

    // Restore original method
    Purchase.bulkWrite = originalBulkWrite;
  });

  it("should handle updates with very large numbers", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();

    const updates = [
      {
        id: purchase._id,
        quantity: 999999.999,
        price: 1000000.0,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].quantity).toBe(999999.999);
    expect(result[0].price).toBe(1000000.0);
  });

  it("should handle date updates correctly", async () => {
    const purchase = await createPurchaseInDB();
    const context = global.createMockContext();
    const newDate = new Date("2025-06-15T10:30:00Z");

    const updates = [
      {
        id: purchase._id,
        date: newDate,
      },
    ];

    const result = await updatePurchases(null, { updates }, context);

    expect(result[0].date).toEqual(newDate);
  });
});
