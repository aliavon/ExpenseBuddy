const Joi = require("joi");

const loginSchema = Joi.object({
  input: Joi.object({
    email: Joi.string().email().required().messages({
      "string.base": '"email" must be a string',
      "string.email": '"email" must be a valid email address',
      "any.required": '"email" is required',
    }),
    password: Joi.string().min(1).required().messages({
      "string.base": '"password" must be a string',
      "string.empty": '"password" cannot be empty',
      "any.required": '"password" is required',
    }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = loginSchema;
