const Joi = require("joi");

const updateFamilySchema = Joi.object({
  input: Joi.object({
    name: Joi.string().min(1).max(100).optional().messages({
      "string.base": '"name" must be a string',
      "string.empty": '"name" cannot be empty',
      "string.min": '"name" must be at least 1 character long',
      "string.max": '"name" cannot exceed 100 characters',
    }),
    description: Joi.string().max(500).optional().allow("").messages({
      "string.base": '"description" must be a string',
      "string.max": '"description" cannot exceed 500 characters',
    }),
    timezone: Joi.string().optional().messages({
      "string.base": '"timezone" must be a string',
    }),
  })
    .required()
    .min(1) // At least one field must be provided
    .messages({
      "any.required": '"input" is required',
      "object.min":
        "At least one field (name, description, or timezone) must be provided",
    }),
});

module.exports = updateFamilySchema;
