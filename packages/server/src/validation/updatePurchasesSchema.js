const Joi = require("joi");
const updatePurchaseInputSchema = require("./updatePurchaseInputSchema");

const updatePurchasesInputsSchema = Joi.array()
  .items(updatePurchaseInputSchema)
  .required();

const updatePurchasesSchema = Joi.object({
  updates: updatePurchasesInputsSchema,
});

module.exports = updatePurchasesSchema;
