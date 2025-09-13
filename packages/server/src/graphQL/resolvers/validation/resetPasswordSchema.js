const Joi = require("joi");

const resetPasswordSchema = Joi.object({
  input: Joi.object({
    token: Joi.string().required().messages({
      "string.base": '"token" must be a string',
      "string.empty": '"token" cannot be empty',
      "any.required": '"token" is required',
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

module.exports = resetPasswordSchema;
