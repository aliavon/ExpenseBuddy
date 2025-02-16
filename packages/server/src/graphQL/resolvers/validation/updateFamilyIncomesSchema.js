const Joi = require("joi");
const { PERIODICITY_VALUES } = require("../../../constants/familyIncomeEnums");
const { MONGO_ID_REGEXP } = require("../../../constants");

const updateFamilyIncomeInputSchema = Joi.object({
  id: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"id" must be a valid ObjectId',
    "any.required": '"id" is required',
  }),
  date: Joi.string().isoDate().optional().messages({
    "string.isoDate": '"date" must be a valid ISO date',
  }),
  amount: Joi.number().positive().optional().messages({
    "number.base": '"amount" must be a number',
    "number.positive": '"amount" must be positive',
  }),
  note: Joi.string().allow("").optional().messages({
    "string.base": '"note" must be a string',
  }),
  periodicity: Joi.string()
    .valid(...PERIODICITY_VALUES)
    .optional()
    .messages({
      "any.only": `"periodicity" must be one of [${PERIODICITY_VALUES.join(
        ", "
      )}]`,
    }),
  typeId: Joi.string().regex(MONGO_ID_REGEXP).optional().messages({
    "string.pattern.base": '"typeId" must be a valid ObjectId',
  }),
  contributorId: Joi.string().regex(MONGO_ID_REGEXP).optional().messages({
    "string.pattern.base": '"contributorId" must be a valid ObjectId',
  }),
  currencyId: Joi.string().regex(MONGO_ID_REGEXP).optional().messages({
    "string.pattern.base": '"currencyId" must be a valid ObjectId',
  }),
});

const updateFamilyIncomesInputsSchema = Joi.array()
  .items(updateFamilyIncomeInputSchema)
  .min(1)
  .required()
  .messages({
    "array.base": '"updates" must be an array',
    "array.min": '"updates" must contain at least one element',
    "any.required": '"updates" is required',
  });

const updateFamilyIncomesSchema = Joi.object({
  updates: updateFamilyIncomesInputsSchema,
});

module.exports = updateFamilyIncomesSchema;
