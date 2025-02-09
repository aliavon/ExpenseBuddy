const Joi = require("joi");

const itemInputSchema = Joi.object({
  name: Joi.string().min(1).required(),
  category: Joi.string().allow("").optional(),
});

module.exports = itemInputSchema;
