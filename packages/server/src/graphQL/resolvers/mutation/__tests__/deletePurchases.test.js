const deletePurchases = require("../deletePurchases");
const { Purchase } = require("../../../../database/schemas");

describe("deletePurchases mutation", () => {
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

  const createPurchaseInDB = async (
    data = {},
    context = global.createMockContext()
  ) => {
    const purchaseData = createPurchaseData({
      familyId: context.auth.user.familyId,
      createdByUserId: context.auth.user.id,
      ...data,
    });
    const purchase = new Purchase(purchaseData);
    return await purchase.save();
  };

  it("should delete single purchase successfully", async () => {
    const context = global.createMockContext();
    const purchase = await createPurchaseInDB({}, context);

    const result = await deletePurchases(
      null,
      { ids: [purchase._id] },
      context
    );

    expect(result).toEqual([purchase._id]);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 1,
        deletedCount: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify purchase was actually deleted
    const deletedPurchase = await Purchase.findById(purchase._id);
    expect(deletedPurchase).toBeNull();
  });

  it("should delete multiple purchases successfully", async () => {
    const context = global.createMockContext();
    const purchase1 = await createPurchaseInDB({ quantity: 1 }, context);
    const purchase2 = await createPurchaseInDB({ quantity: 2 }, context);
    const purchase3 = await createPurchaseInDB({ quantity: 3 }, context);

    const ids = [purchase1._id, purchase2._id, purchase3._id];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 3,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify all purchases were actually deleted
    const remainingPurchases = await Purchase.find({ _id: { $in: ids } });
    expect(remainingPurchases).toHaveLength(0);
  });

  it("should handle empty ids array", async () => {
    const context = global.createMockContext();

    const result = await deletePurchases(null, { ids: [] }, context);

    expect(result).toEqual([]);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 0,
        deletedCount: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );
  });

  it("should handle non-existent purchase IDs gracefully", async () => {
    const nonExistentId1 = global.createMockId();
    const nonExistentId2 = global.createMockId();
    const context = global.createMockContext();

    const ids = [nonExistentId1, nonExistentId2];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 2,
        deletedCount: 0,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );
  });

  it("should handle mixed existing and non-existing IDs", async () => {
    const context = global.createMockContext();
    const existingPurchase1 = await createPurchaseInDB(
      { quantity: 1 },
      context
    );
    const existingPurchase2 = await createPurchaseInDB(
      { quantity: 2 },
      context
    );
    const nonExistentId = global.createMockId();

    const ids = [existingPurchase1._id, nonExistentId, existingPurchase2._id];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify existing purchases were deleted
    const deletedPurchase1 = await Purchase.findById(existingPurchase1._id);
    const deletedPurchase2 = await Purchase.findById(existingPurchase2._id);
    expect(deletedPurchase1).toBeNull();
    expect(deletedPurchase2).toBeNull();
  });

  it("should preserve order of IDs in result", async () => {
    const purchase1 = await createPurchaseInDB();
    const purchase2 = await createPurchaseInDB();
    const context = global.createMockContext();
    const purchase3 = await createPurchaseInDB({}, context);

    const ids = [purchase3._id, purchase1._id, purchase2._id];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual([purchase3._id, purchase1._id, purchase2._id]);
  });

  it("should handle large batch deletion", async () => {
    const context = global.createMockContext();
    const purchases = [];
    for (let i = 1; i <= 50; i++) {
      purchases.push(await createPurchaseInDB({ quantity: i }, context));
    }

    const ids = purchases.map((p) => p._id);

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 50,
        deletedCount: 50,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify all purchases were deleted
    const remainingPurchases = await Purchase.find({ _id: { $in: ids } });
    expect(remainingPurchases).toHaveLength(0);
  });

  it("should handle duplicate IDs in input", async () => {
    const context = global.createMockContext();
    const purchase = await createPurchaseInDB({}, context);

    const ids = [purchase._id, purchase._id, purchase._id];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 3,
        deletedCount: 1,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify purchase was deleted (only once, despite multiple IDs)
    const deletedPurchase = await Purchase.findById(purchase._id);
    expect(deletedPurchase).toBeNull();
  });

  it("should not affect other purchases", async () => {
    const context = global.createMockContext();
    const purchaseToDelete = await createPurchaseInDB({ quantity: 1 }, context);
    const purchaseToKeep1 = await createPurchaseInDB({ quantity: 2 }, context);
    const purchaseToKeep2 = await createPurchaseInDB({ quantity: 3 }, context);

    await deletePurchases(null, { ids: [purchaseToDelete._id] }, context);

    // Verify only the targeted purchase was deleted
    const deletedPurchase = await Purchase.findById(purchaseToDelete._id);
    const keptPurchase1 = await Purchase.findById(purchaseToKeep1._id);
    const keptPurchase2 = await Purchase.findById(purchaseToKeep2._id);

    expect(deletedPurchase).toBeNull();
    expect(keptPurchase1).not.toBeNull();
    expect(keptPurchase2).not.toBeNull();
    expect(keptPurchase1.quantity).toBe(2);
    expect(keptPurchase2.quantity).toBe(3);
  });

  it("should handle deletion of purchases with different data types", async () => {
    const context = global.createMockContext();
    const purchases = [
      await createPurchaseInDB(
        {
          quantity: 1.5,
          price: 10.99,
          note: "Test item 1",
        },
        context
      ),
      await createPurchaseInDB(
        {
          quantity: 2,
          price: 20.0,
          discount: 2.5,
        },
        context
      ),
      await createPurchaseInDB(
        {
          quantity: 3.75,
          unit: "lbs",
          date: new Date("2024-12-25"),
        },
        context
      ),
    ];

    const ids = purchases.map((p) => p._id);

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);

    // Verify all were deleted regardless of their data
    for (const purchase of purchases) {
      const deletedPurchase = await Purchase.findById(purchase._id);
      expect(deletedPurchase).toBeNull();
    }
  });

  it("should handle database errors gracefully", async () => {
    const context = global.createMockContext();
    const purchase = await createPurchaseInDB({}, context);

    // Mock Purchase.deleteMany to throw an error
    const originalDeleteMany = Purchase.deleteMany;
    Purchase.deleteMany = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    await expect(
      deletePurchases(null, { ids: [purchase._id] }, context)
    ).rejects.toThrow("Database connection failed");

    // Restore original method
    Purchase.deleteMany = originalDeleteMany;
  });

  it("should handle very large ID arrays", async () => {
    // Create a large array of IDs (some existing, some not)
    const context = global.createMockContext();
    const existingPurchases = [];
    for (let i = 0; i < 10; i++) {
      existingPurchases.push(
        await createPurchaseInDB({ quantity: i + 1 }, context)
      );
    }

    const ids = [];
    // Add existing IDs
    existingPurchases.forEach((p) => ids.push(p._id));
    // Add many non-existing IDs
    for (let i = 0; i < 100; i++) {
      ids.push(global.createMockId());
    }

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toEqual(ids);
    expect(result).toHaveLength(110);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 110,
        deletedCount: 10,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify existing purchases were deleted
    for (const purchase of existingPurchases) {
      const deletedPurchase = await Purchase.findById(purchase._id);
      expect(deletedPurchase).toBeNull();
    }
  });

  it("should handle ObjectId strings and ObjectId objects", async () => {
    const context = global.createMockContext();
    const purchase1 = await createPurchaseInDB({}, context);
    const purchase2 = await createPurchaseInDB({}, context);

    // Mix string and ObjectId formats
    const ids = [
      purchase1._id.toString(), // string format
      purchase2._id, // ObjectId format
    ];

    const result = await deletePurchases(null, { ids }, context);

    expect(result).toHaveLength(2);
    expect(context.logger.info).toHaveBeenLastCalledWith(
      {
        requestedCount: 2,
        deletedCount: 2,
        userId: context.auth.user.id,
        familyId: context.auth.user.familyId,
      },
      "Successfully deleted family purchases"
    );

    // Verify both were deleted
    const deletedPurchase1 = await Purchase.findById(purchase1._id);
    const deletedPurchase2 = await Purchase.findById(purchase2._id);
    expect(deletedPurchase1).toBeNull();
    expect(deletedPurchase2).toBeNull();
  });

  it("should return original IDs even after successful deletion", async () => {
    const purchase = await createPurchaseInDB();
    const originalId = purchase._id;
    const context = global.createMockContext();

    const result = await deletePurchases(null, { ids: [originalId] }, context);

    expect(result).toEqual([originalId]);
    expect(result[0]).toBe(originalId); // Same reference
  });
});
