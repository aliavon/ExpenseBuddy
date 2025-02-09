const Joi = require("joi");

const updatePurchaseInputSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  itemId: Joi.string().optional(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  discount: Joi.number().min(0).optional(),
  date: Joi.string().isoDate().optional(),
  note: Joi.string().allow("").optional(),
});

module.exports = updatePurchaseInputSchema;
