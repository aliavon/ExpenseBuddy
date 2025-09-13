const Joi = require("joi");

const registerSchema = Joi.object({
  input: Joi.object({
    firstName: Joi.string().min(1).max(50).required().messages({
      "string.base": '"firstName" must be a string',
      "string.empty": '"firstName" cannot be empty',
      "string.min": '"firstName" must be at least 1 character long',
      "string.max": '"firstName" cannot exceed 50 characters',
      "any.required": '"firstName" is required',
    }),
    lastName: Joi.string().min(1).max(50).required().messages({
      "string.base": '"lastName" must be a string',
      "string.empty": '"lastName" cannot be empty',
      "string.min": '"lastName" must be at least 1 character long',
      "string.max": '"lastName" cannot exceed 50 characters',
      "any.required": '"lastName" is required',
    }),
    middleName: Joi.string().max(50).optional().allow("").messages({
      "string.base": '"middleName" must be a string',
      "string.max": '"middleName" cannot exceed 50 characters',
    }),
    email: Joi.string().email().required().messages({
      "string.base": '"email" must be a string',
      "string.email": '"email" must be a valid email address',
      "any.required": '"email" is required',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      "string.base": '"password" must be a string',
      "string.min": '"password" must be at least 8 characters long',
      "string.max": '"password" cannot exceed 128 characters',
      "any.required": '"password" is required',
    }),
    familyName: Joi.string().min(1).max(100).optional().messages({
      "string.base": '"familyName" must be a string',
      "string.min": '"familyName" must be at least 1 character long',
      "string.max": '"familyName" cannot exceed 100 characters',
    }),
    inviteCode: Joi.string()
      .length(16)
      .pattern(/^[A-Z0-9]{16}$/)
      .optional()
      .messages({
        "string.base": '"inviteCode" must be a string',
        "string.length": '"inviteCode" must be exactly 16 characters long',
        "string.pattern.base":
          '"inviteCode" must be exactly 16 uppercase characters',
      }),
    invitationToken: Joi.string().optional().messages({
      "string.base": '"invitationToken" must be a string',
    }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = registerSchema;
