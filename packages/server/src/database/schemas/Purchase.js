const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const purchaseSchema = new mongoose.Schema({
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

purchaseSchema.index({ date: 1 });

module.exports = mongoose.model(modelNames.Purchase, purchaseSchema);
