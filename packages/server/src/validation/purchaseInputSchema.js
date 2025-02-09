const Joi = require("joi");

const purchaseInputSchema = Joi.object({
  itemId: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().required(),
  price: Joi.number().positive().required(),
  discount: Joi.number().min(0).default(0),
  date: Joi.string().isoDate().required(),
  note: Joi.string().allow("").optional(),
});

module.exports = purchaseInputSchema;
