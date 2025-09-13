const Joi = require("joi");

const inviteToFamilySchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": '"email" must be a string',
    "string.email": '"email" must be a valid email address',
    "string.empty": '"email" cannot be empty',
    "any.required": '"email" is required',
  }),
  role: Joi.string().valid("ADMIN", "MEMBER").required().messages({
    "string.base": '"role" must be a string',
    "any.only": '"role" must be one of: ADMIN, MEMBER',
    "any.required": '"role" is required',
  }),
  message: Joi.string().max(500).optional().messages({
    "string.base": '"message" must be a string',
    "string.max": '"message" must be at most 500 characters long',
  }),
});

module.exports = inviteToFamilySchema;
