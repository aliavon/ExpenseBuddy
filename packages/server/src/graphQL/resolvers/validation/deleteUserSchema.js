const Joi = require("joi");
const { MONGO_ID_REGEXP } = require("../../../constants");

const deleteUserSchema = Joi.object({
  id: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"id" must be a valid ObjectId',
    "any.required": '"id" is required',
  }),
});

module.exports = deleteUserSchema;
