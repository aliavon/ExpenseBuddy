const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../constants");

const deletePurchasesSchema = Joi.object({
  ids: Joi.array().items(Joi.string().regex(MONGO_ID_REGEXP)).min(1).required(),
});

module.exports = deletePurchasesSchema;
