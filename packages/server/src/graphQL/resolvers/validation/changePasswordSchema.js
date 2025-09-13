const Joi = require("joi");

const changePasswordSchema = Joi.object({
  input: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.base": '"currentPassword" must be a string',
      "string.empty": '"currentPassword" cannot be empty',
      "any.required": '"currentPassword" is required',
    }),
    newPassword: Joi.string().min(8).max(128).required().messages({
      "string.base": '"newPassword" must be a string',
      "string.min": '"newPassword" must be at least 8 characters long',
      "string.max": '"newPassword" cannot exceed 128 characters',
      "any.required": '"newPassword" is required',
    }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = changePasswordSchema;
