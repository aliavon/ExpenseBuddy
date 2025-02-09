const Joi = require('joi');

const getPurchasesSchema = Joi.object({
  from: Joi.string().isoDate().required(),
  to: Joi.string().isoDate().required(),
});

module.exports = getPurchasesSchema;
