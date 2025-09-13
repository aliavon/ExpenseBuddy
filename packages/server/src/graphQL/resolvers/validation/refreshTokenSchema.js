const Joi = require("joi");

const refreshTokenSchema = Joi.object({
  input: Joi.object({
    refreshToken: Joi.string().required().messages({
      "string.base": '"refreshToken" must be a string',
      "string.empty": '"refreshToken" cannot be empty',
      "any.required": '"refreshToken" is required',
    }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = refreshTokenSchema;
