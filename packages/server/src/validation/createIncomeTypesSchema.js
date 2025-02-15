const Joi = require("joi");

const incomeTypeInputSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    "string.base": '"name" must be a string',
    "string.empty": '"name" cannot be empty',
    "any.required": '"name" is required',
  }),
  description: Joi.string().allow("").optional().messages({
    "string.base": '"description" must be a string',
  }),
});

const createIncomeTypesSchema = Joi.object({
  incomeTypes: Joi.array()
    .items(incomeTypeInputSchema)
    .min(1)
    .required()
    .messages({
      "array.base": '"incomeTypes" must be an array',
      "array.min": '"incomeTypes" must contain at least one element',
      "any.required": '"incomeTypes" is required',
    }),
});

module.exports = createIncomeTypesSchema;
