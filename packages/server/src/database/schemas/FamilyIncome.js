const mongoose = require("mongoose");
const {
  PERIODICITY,
  PERIODICITY_VALUES,
} = require("../../constants/familyIncomeEnums");
const modelNames = require("../modelNames");

const familyIncomeSchema = new mongoose.Schema({
  // Family context for multi-family support
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Family,
    required: true,
    index: true,
  },

  date: {
    type: Date,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"],
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.IncomeType,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  contributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.User,
    required: true,
  },
  periodicity: {
    type: String,
    enum: PERIODICITY_VALUES,
    default: PERIODICITY.ONE_TIME,
  },
  currencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: modelNames.Currency,
    required: true,
  },
});

// Compound indexes for better query performance
familyIncomeSchema.index({ familyId: 1, date: -1 });
familyIncomeSchema.index({ familyId: 1, contributorId: 1 });
familyIncomeSchema.index({ date: 1 }); // Keep existing index

module.exports = mongoose.model(modelNames.FamilyIncome, familyIncomeSchema);
