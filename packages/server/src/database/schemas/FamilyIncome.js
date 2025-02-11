const mongoose = require("mongoose");
const { PERIODICITY } = require("../constants/familyIncomeEnums");
const modelNames = require("../modelNames");

const familyIncomeSchema = new mongoose.Schema({
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
    enum: Object.values(PERIODICITY),
    default: PERIODICITY.ONE_TIME,
  },
});

familyIncomeSchema.index({ date: 1 });

module.exports = mongoose.model(modelNames.FamilyIncome, familyIncomeSchema);
