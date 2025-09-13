const Joi = require("joi");

const updateMemberRoleSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.base": '"userId" must be a string',
    "string.empty": '"userId" cannot be empty',
    "any.required": '"userId" is required',
  }),
  role: Joi.string().valid("ADMIN", "MEMBER").required().messages({
    "string.base": '"role" must be a string',
    "any.only": '"role" must be one of: ADMIN, MEMBER',
    "any.required": '"role" is required',
  }),
});

module.exports = updateMemberRoleSchema;
