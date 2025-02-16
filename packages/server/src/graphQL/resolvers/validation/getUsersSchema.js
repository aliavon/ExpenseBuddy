const Joi = require("joi");

const getUsersSchema = Joi.object({
  search: Joi.string().allow("").optional().messages({
    "string.base": '"search" must be a string',
  }),
});

module.exports = getUsersSchema;
