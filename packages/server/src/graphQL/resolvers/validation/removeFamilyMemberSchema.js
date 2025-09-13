const Joi = require("joi");

const removeFamilyMemberSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.base": '"userId" must be a string',
    "string.empty": '"userId" cannot be empty',
    "any.required": '"userId" is required',
  }),
});

module.exports = removeFamilyMemberSchema;
