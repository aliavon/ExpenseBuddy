const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const currencySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  symbol: { type: String, default: "" },
});

module.exports = mongoose.model(modelNames.Currency, currencySchema);
