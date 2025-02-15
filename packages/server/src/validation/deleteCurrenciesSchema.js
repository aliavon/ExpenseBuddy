const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../constants");

const deleteCurrenciesSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().regex(MONGO_ID_REGEXP))
    .min(1)
    .required()
    .messages({
      "array.base": '"ids" must be an array',
      "array.min": '"ids" must contain at least one element',
      "any.required": '"ids" is required',
      "string.pattern.base": '"ids" must contain valid ObjectIds',
    }),
});

module.exports = deleteCurrenciesSchema;
