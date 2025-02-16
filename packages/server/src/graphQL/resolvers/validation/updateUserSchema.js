const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../../../constants");

const updateUserSchema = Joi.object({
  user: Joi.object({
    id: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
      "string.pattern.base": '"id" must be a valid ObjectId',
      "any.required": '"id" is required',
    }),
    firstName: Joi.string().min(1).optional().messages({
      "string.base": '"firstName" must be a string',
      "string.empty": '"firstName" cannot be empty',
    }),
    middleName: Joi.string().allow("").optional().messages({
      "string.base": '"middleName" must be a string',
    }),
    lastName: Joi.string().min(1).optional().messages({
      "string.base": '"lastName" must be a string',
      "string.empty": '"lastName" cannot be empty',
    }),
  })
    .required()
    .messages({
      "any.required": '"user" is required',
    }),
});

module.exports = updateUserSchema;
