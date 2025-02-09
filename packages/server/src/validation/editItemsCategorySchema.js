const Joi = require("joi");

const editItemsCategorySchema = Joi.object({
  names: Joi.array().items(Joi.string().min(1)).min(1).required(),
  newCategory: Joi.string().min(1).required(),
});

module.exports = editItemsCategorySchema;
