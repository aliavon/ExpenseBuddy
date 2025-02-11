const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const incomeTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model(modelNames.IncomeType, incomeTypeSchema);
