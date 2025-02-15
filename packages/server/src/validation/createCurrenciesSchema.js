const Joi = require("joi");

const currencyInputSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    "string.base": '"name" must be a string',
    "string.empty": '"name" cannot be empty',
    "any.required": '"name" is required',
  }),
  code: Joi.string().min(1).required().messages({
    "string.base": '"code" must be a string',
    "string.empty": '"code" cannot be empty',
    "any.required": '"code" is required',
  }),
  symbol: Joi.string().optional().messages({
    "string.base": '"symbol" must be a string',
  }),
});

const createCurrenciesSchema = Joi.object({
  currencies: Joi.array()
    .items(currencyInputSchema)
    .min(1)
    .required()
    .messages({
      "array.base": '"currencies" must be an array',
      "array.min": '"currencies" must contain at least one element',
      "any.required": '"currencies" is required',
    }),
});

module.exports = createCurrenciesSchema;
