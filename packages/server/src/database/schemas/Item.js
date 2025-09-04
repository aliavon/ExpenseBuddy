const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const itemSchema = new mongoose.Schema({
  // Family context for multi-family support
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Family,
    required: true,
    index: true,
  },

  name: { type: String, required: true },
  category: { type: String, default: "" },
});

// Compound index to prevent duplicate items per family
itemSchema.index({ familyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model(modelNames.Item, itemSchema);
