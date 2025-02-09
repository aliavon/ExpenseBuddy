const Joi = require("joi");
const purchaseInputSchema = require("./purchaseInputSchema");

const purchaseInputsSchema = Joi.array().items(purchaseInputSchema).required();

const addPurchasesSchema = Joi.object({
  purchases: purchaseInputsSchema,
});

module.exports = addPurchasesSchema;
