const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  date: { type: Date, required: true },
  note: { type: String, default: "" },
});

module.exports = mongoose.model('Purchase', purchaseSchema);;
