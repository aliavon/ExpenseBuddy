const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../constants");

const updateCurrencyInputSchema = Joi.object({
  id: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"id" must be a valid ObjectId',
    "any.required": '"id" is required',
  }),
  name: Joi.string().min(1).optional().messages({
    "string.base": '"name" must be a string',
    "string.empty": '"name" cannot be empty',
  }),
  code: Joi.string().min(1).optional().messages({
    "string.base": '"code" must be a string',
    "string.empty": '"code" cannot be empty',
  }),
  symbol: Joi.string().optional().messages({
    "string.base": '"symbol" must be a string',
  }),
});

const updateCurrenciesInputsSchema = Joi.array()
  .items(updateCurrencyInputSchema)
  .min(1)
  .required()
  .messages({
    "array.base": '"updates" must be an array',
    "array.min": '"updates" must contain at least one element',
    "any.required": '"updates" is required',
  });

const updateCurrenciesSchema = Joi.object({
  updates: updateCurrenciesInputsSchema,
});

module.exports = updateCurrenciesSchema;
