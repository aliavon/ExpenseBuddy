const Joi = require("joi");

const deletePurchasesSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required(),
});

module.exports = deletePurchasesSchema;
