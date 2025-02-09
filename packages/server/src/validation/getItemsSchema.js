const Joi = require("joi");

const getItemsSchema = Joi.object({
  names: Joi.array().items(Joi.string().min(1)).optional(),
  category: Joi.string().allow("").optional(),
});

module.exports = getItemsSchema;
