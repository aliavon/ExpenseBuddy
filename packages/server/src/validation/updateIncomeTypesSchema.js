const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../constants");

const updateIncomeTypeInputSchema = Joi.object({
  id: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"id" must be a valid ObjectId',
    "any.required": '"id" is required',
  }),
  name: Joi.string().min(1).optional().messages({
    "string.base": '"name" must be a string',
    "string.empty": '"name" cannot be empty',
  }),
  description: Joi.string().allow("").optional().messages({
    "string.base": '"description" must be a string',
  }),
});

const updateIncomeTypesInputsSchema = Joi.array()
  .items(updateIncomeTypeInputSchema)
  .min(1)
  .required()
  .messages({
    "array.base": '"updates" must be an array',
    "array.min": '"updates" must contain at least one element',
    "any.required": '"updates" is required',
  });

const updateIncomeTypesSchema = Joi.object({
  updates: updateIncomeTypesInputsSchema,
});

module.exports = updateIncomeTypesSchema;
