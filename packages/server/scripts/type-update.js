"use strict";

const mongoose = require("mongoose");
const Purchase = require("../src/database/schemas/Purchase");
const DATABASE_URL = "mongodb://localhost:27017/server";
const { mongooseConfig } = require("../src/config");

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(DATABASE_URL, mongooseConfig);
    console.log("Connected to database");

    const purchases = await Purchase.find({ itemId: { $type: "string" } });
    console.log(`Found ${purchases.length} purchases with itemId as string`);

    for (const purchase of purchases) {
      try {
        const newItemId = mongoose.Types.ObjectId(purchase.itemId);
        await Purchase.updateOne(
          { _id: purchase._id },
          { $set: { itemId: newItemId } }
        );
        console.log(
          `Updated purchase ${purchase._id} with new itemId ${newItemId}`
        );
      } catch (err) {
        console.error(
          `Error updating purchase ${purchase._id}: ${err.message}`
        );
      }
    }

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

runMigration();
