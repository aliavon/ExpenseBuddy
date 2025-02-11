const mongoose = require("mongoose");
const modelNames = require("../modelNames");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "" },
});

module.exports = mongoose.model(modelNames.Item, itemSchema);
