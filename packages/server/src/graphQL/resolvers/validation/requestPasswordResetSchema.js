const Joi = require("joi");

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": '"email" must be a string',
    "string.email": '"email" must be a valid email address',
    "string.empty": '"email" cannot be empty',
    "any.required": '"email" is required',
  }),
});

module.exports = requestPasswordResetSchema;
