const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const purchaseSchema = new mongoose.Schema({
  // Family context for multi-family support
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Family,
    required: true,
    index: true,
  },

  // Track who created this purchase
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.User,
    required: true,
  },

  // Existing fields
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Item,
    required: true,
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  date: { type: Date, required: true, index: true },
  note: { type: String, default: "" },
});

// Compound indexes for better query performance
purchaseSchema.index({ familyId: 1, date: -1 });
purchaseSchema.index({ familyId: 1, createdByUserId: 1 });
purchaseSchema.index({ date: 1 }); // Keep existing index

module.exports = mongoose.model(modelNames.Purchase, purchaseSchema);
