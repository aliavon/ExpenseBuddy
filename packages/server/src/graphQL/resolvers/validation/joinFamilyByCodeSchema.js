const Joi = require("joi");

const joinFamilyByCodeSchema = Joi.object({
  input: Joi.object({
    inviteCode: Joi.string()
      .length(16)
      .pattern(/^[A-Z0-9]{16}$/)
      .required()
      .messages({
        "string.base": '"inviteCode" must be a string',
        "string.empty": '"inviteCode" cannot be empty',
        "string.length": '"inviteCode" must be exactly 16 characters long',
        "string.pattern.base":
          '"inviteCode" must be exactly 16 uppercase characters',
        "any.required": '"inviteCode" is required',
      }),
  })
    .required()
    .messages({
      "any.required": '"input" is required',
    }),
});

module.exports = joinFamilyByCodeSchema;
