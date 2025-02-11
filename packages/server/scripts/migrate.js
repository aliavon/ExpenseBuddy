"use strict";

const mongoose = require("mongoose");
const { Purchase, Item } = require("../src/database/schemas");

const DATABASE_URL = "mongodb://localhost:27017/server";

async function runMigration() {
  try {
    console.log("DATABASE_URL", DATABASE_URL);

    await mongoose.connect(DATABASE_URL, {
      autoIndex: false,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("Connected to database");

    const purchases = await Purchase.find();
    console.log(`Found ${purchases.length} purchases`);

    const groupedPurchases = {};
    purchases.forEach((purchase) => {
      const name = purchase.name;
      if (!groupedPurchases[name]) {
        groupedPurchases[name] = [];
      }
      groupedPurchases[name].push(purchase);
    });

    for (const name in groupedPurchases) {
      const group = groupedPurchases[name];

      const categories = group
        .map((p) => p.category)
        .filter((cat) => cat && cat.trim() !== "");
      const distinctCategories = [...new Set(categories)];

      let chosenCategory = "";
      if (distinctCategories.length === 1) {
        chosenCategory = distinctCategories[0];
      } else if (distinctCategories.length > 1) {
        const frequency = {};
        categories.forEach((cat) => {
          frequency[cat] = (frequency[cat] || 0) + 1;
        });
        chosenCategory = Object.keys(frequency).reduce((a, b) =>
          frequency[a] > frequency[b] ? a : b
        );
      }

      let item = await Item.findOne({ name });
      if (!item) {
        item = await Item.create({ name, category: chosenCategory });
        console.log(
          `Created item for '${name}' with category '${chosenCategory}'`
        );
      } else {
        if (item.category !== chosenCategory) {
          item.category = chosenCategory;
          await item.save();
          console.log(
            `Updated item for '${name}' with new category '${chosenCategory}'`
          );
        }
      }

      const purchaseIds = group.map((p) => p._id);
      await Purchase.updateMany(
        { _id: { $in: purchaseIds } },
        { $set: { itemId: item._id.toString() } }
      );
      console.log(`Updated ${group.length} purchases for item '${name}'`);
    }

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

runMigration();
