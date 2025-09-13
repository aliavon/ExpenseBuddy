const Joi = require("joi");

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.base": '"token" must be a string',
    "string.empty": '"token" cannot be empty',
    "any.required": '"token" is required',
  }),
});

module.exports = verifyEmailSchema;
