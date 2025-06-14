const Purchase = require("../Purchase");
const Item = require("../Item");
const mongoose = require("mongoose");

describe("Purchase Schema", () => {
  let testItem;

  beforeEach(async () => {
    testItem = await Item.create({
      name: "Test Item",
      category: "Electronics",
    });
  });

  it("should create purchase with required fields", async () => {
    const purchaseData = {
      itemId: testItem._id,
      quantity: 2,
      unit: "pieces",
      price: 100.50,
      discount: 10,
      date: new Date("2023-01-01"),
      note: "Test purchase",
    };

    const purchase = new Purchase(purchaseData);
    const savedPurchase = await purchase.save();

    expect(savedPurchase.itemId.toString()).toBe(testItem._id.toString());
    expect(savedPurchase.quantity).toBe(purchaseData.quantity);
    expect(savedPurchase.unit).toBe(purchaseData.unit);
    expect(savedPurchase.price).toBe(purchaseData.price);
    expect(savedPurchase.discount).toBe(purchaseData.discount);
    expect(savedPurchase.date).toEqual(purchaseData.date);
    expect(savedPurchase.note).toBe(purchaseData.note);
  });

  it("should create purchase with default values", async () => {
    const purchaseData = {
      itemId: testItem._id,
      quantity: 1,
      unit: "piece",
      price: 50,
      date: new Date(),
    };

    const purchase = new Purchase(purchaseData);
    const savedPurchase = await purchase.save();

    expect(savedPurchase.discount).toBe(0);
    expect(savedPurchase.note).toBe("");
  });

  it("should fail validation without required fields", async () => {
    const testCases = [
      { field: "itemId", data: { quantity: 1, unit: "piece", price: 50, date: new Date() } },
      { field: "quantity", data: { itemId: testItem._id, unit: "piece", price: 50, date: new Date() } },
      { field: "unit", data: { itemId: testItem._id, quantity: 1, price: 50, date: new Date() } },
      { field: "price", data: { itemId: testItem._id, quantity: 1, unit: "piece", date: new Date() } },
      { field: "date", data: { itemId: testItem._id, quantity: 1, unit: "piece", price: 50 } },
    ];

    for (const testCase of testCases) {
      const purchase = new Purchase(testCase.data);
      
      let error;
      try {
        await purchase.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors[testCase.field]).toBeDefined();
    }
  });

  it("should validate ObjectId for itemId", async () => {
    const purchase = new Purchase({
      itemId: "invalid-id",
      quantity: 1,
      unit: "piece",
      price: 50,
      date: new Date(),
    });

    let error;
    try {
      await purchase.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.itemId).toBeDefined();
  });

  it("should find purchases by date range", async () => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-12-31");
    const outsideDate = new Date("2024-01-01");

    await Purchase.create([
      { itemId: testItem._id, quantity: 1, unit: "piece", price: 50, date: startDate },
      { itemId: testItem._id, quantity: 2, unit: "piece", price: 75, date: new Date("2023-06-15") },
      { itemId: testItem._id, quantity: 1, unit: "piece", price: 25, date: outsideDate },
    ]);

    const purchases = await Purchase.find({
      date: { $gte: startDate, $lte: endDate }
    });

    expect(purchases).toHaveLength(2);
  });

  it("should populate item reference", async () => {
    const purchase = await Purchase.create({
      itemId: testItem._id,
      quantity: 1,
      unit: "piece",
      price: 50,
      date: new Date(),
    });

    const populatedPurchase = await Purchase.findById(purchase._id).populate("itemId");
    
    expect(populatedPurchase.itemId.name).toBe(testItem.name);
    expect(populatedPurchase.itemId.category).toBe(testItem.category);
  });

  it("should calculate total with discount", async () => {
    const purchase = await Purchase.create({
      itemId: testItem._id,
      quantity: 2,
      unit: "pieces",
      price: 100,
      discount: 20,
      date: new Date(),
    });

    const total = purchase.quantity * purchase.price - purchase.discount;
    expect(total).toBe(180); // 2 * 100 - 20
  });

  it("should handle date indexing", async () => {
    const purchases = [];
    for (let i = 0; i < 5; i++) {
      purchases.push({
        itemId: testItem._id,
        quantity: 1,
        unit: "piece",
        price: 50,
        date: new Date(2023, i, 1),
      });
    }

    await Purchase.create(purchases);

    const sortedPurchases = await Purchase.find({}).sort({ date: 1 });
    
    for (let i = 1; i < sortedPurchases.length; i++) {
      expect(sortedPurchases[i].date.getTime()).toBeGreaterThanOrEqual(
        sortedPurchases[i - 1].date.getTime()
      );
    }
  });
}); 