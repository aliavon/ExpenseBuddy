const Joi = require("joi");
const { PERIODICITY_VALUES } = require("../../../constants/familyIncomeEnums");
const { MONGO_ID_REGEXP } = require("../../../constants");

// Schema for a single FamilyIncome input
const familyIncomeInputSchema = Joi.object({
  date: Joi.string().isoDate().required().messages({
    "string.isoDate": '"date" must be a valid ISO date',
    "any.required": '"date" is required',
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": '"amount" must be a number',
    "number.positive": '"amount" must be positive',
    "any.required": '"amount" is required',
  }),
  note: Joi.string().allow("").optional().messages({
    "string.base": '"note" must be a string',
  }),
  periodicity: Joi.string()
    .valid(...PERIODICITY_VALUES)
    .required()
    .messages({
      "any.only": `"periodicity" must be one of [${PERIODICITY_VALUES.join(
        ", "
      )}]`,
      "any.required": '"periodicity" is required',
    }),
  typeId: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"typeId" must be a valid ObjectId',
    "any.required": '"typeId" is required',
  }),
  contributorId: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"contributorId" must be a valid ObjectId',
    "any.required": '"contributorId" is required',
  }),
  currencyId: Joi.string().regex(MONGO_ID_REGEXP).required().messages({
    "string.pattern.base": '"currencyId" must be a valid ObjectId',
    "any.required": '"currencyId" is required',
  }),
});

// The input for createFamilyIncomes is an object with a "familyIncomes" field (an array)
const createFamilyIncomesSchema = Joi.object({
  familyIncomes: Joi.array()
    .items(familyIncomeInputSchema)
    .min(1)
    .required()
    .messages({
      "array.base": '"familyIncomes" must be an array',
      "array.min": '"familyIncomes" must contain at least one element',
      "any.required": '"familyIncomes" is required',
    }),
});

module.exports = createFamilyIncomesSchema;
