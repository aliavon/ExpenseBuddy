const Joi = require("joi");

const getPurchasesCategorySuggestionSchema = Joi.object({
  names: Joi.array().items(Joi.string().min(1)).min(1).required(),
});

module.exports = getPurchasesCategorySuggestionSchema;
