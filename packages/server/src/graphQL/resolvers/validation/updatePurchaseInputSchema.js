const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../../../constants");

const updatePurchaseInputSchema = Joi.object({
  id: Joi.string().regex(MONGO_ID_REGEXP).required(),
  itemId: Joi.string().optional(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  discount: Joi.number().min(0).optional(),
  date: Joi.string().isoDate().optional(),
  note: Joi.string().allow("").optional(),
});

module.exports = updatePurchaseInputSchema;
