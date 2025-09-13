const Joi = require("joi");

const createFamilySchema = Joi.object({
  input: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      "string.base": '"name" must be a string',
      "string.empty": '"name" cannot be empty',
      "string.min": '"name" must be at least 1 character long',
      "string.max": '"name" cannot exceed 100 characters',
      "any.required": '"name" is required',
    }),
    description: Joi.string().max(500).optional().allow("").messages({
      "string.base": '"description" must be a string',
      "string.max": '"description" cannot exceed 500 characters',
    }),
    timezone: Joi.string().optional().default("UTC").messages({
      "string.base": '"timezone" must be a string',
    }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = createFamilySchema;
