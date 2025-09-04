const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const incomeTypeSchema = new mongoose.Schema({
  // Family context for multi-family support
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Family,
    required: false, // TODO: make required after auth implementation
    default: null,
    index: true,
  },

  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});

// Compound index to prevent duplicate income types per family
incomeTypeSchema.index({ familyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model(modelNames.IncomeType, incomeTypeSchema);
