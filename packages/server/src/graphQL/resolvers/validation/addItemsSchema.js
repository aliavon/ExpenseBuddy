const Joi = require("joi");
const itemInputSchema = require("./itemInputSchema");

const itemInputsSchema = Joi.array().items(itemInputSchema).required();

const addItemsSchema = Joi.object({
  items: itemInputsSchema,
});

module.exports = addItemsSchema;
