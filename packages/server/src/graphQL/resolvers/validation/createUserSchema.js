const Joi = require("joi");

const createUserSchema = Joi.object({
  user: Joi.object({
    firstName: Joi.string().min(1).required().messages({
      "string.base": '"firstName" must be a string',
      "string.empty": '"firstName" cannot be empty',
      "any.required": '"firstName" is required',
    }),
    middleName: Joi.string().allow("").optional().messages({
      "string.base": '"middleName" must be a string',
    }),
    lastName: Joi.string().min(1).required().messages({
      "string.base": '"lastName" must be a string',
      "string.empty": '"lastName" cannot be empty',
      "any.required": '"lastName" is required',
    }),
    isVerified: Joi.boolean().optional(),
  })
    .required()
    .messages({
      "any.required": '"user" is required',
    }),
});

module.exports = createUserSchema;
