const Joi = require('joi');
const purchaseInputsSchema = require('./purchaseInputsSchema');

const addPurchasesSchema = Joi.object({
  purchases: purchaseInputsSchema,
});

module.exports = addPurchasesSchema;
