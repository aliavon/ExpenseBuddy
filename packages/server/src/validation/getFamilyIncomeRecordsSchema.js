const Joi = require("joi");
const { SORT_ORDER_VALUES } = require("../constants/sortOrder");
const { MONGO_ID_REGEXP } = require("../constants");

const familyIncomeFiltersSchema = Joi.object({
  dateFrom: Joi.string().isoDate().optional().messages({
    "string.isoDate": '"dateFrom" must be a valid ISO date',
    "string.empty": '"dateFrom" cannot be empty',
  }),
  dateTo: Joi.string().isoDate().optional().messages({
    "string.isoDate": '"dateTo" must be a valid ISO date',
    "string.empty": '"dateTo" cannot be empty',
  }),
  contributorId: Joi.string().pattern(MONGO_ID_REGEXP).optional().messages({
    "string.pattern.base": '"contributorId" must be a valid ObjectId',
  }),
  typeId: Joi.string().pattern(MONGO_ID_REGEXP).optional().messages({
    "string.pattern.base": '"typeId" must be a valid ObjectId',
  }),
}).optional();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).required().messages({
    "number.base": '"page" must be a number',
    "number.integer": '"page" must be an integer',
    "number.min": '"page" must be at least 1',
    "any.required": '"page" is required',
  }),
  limit: Joi.number().integer().min(1).required().messages({
    "number.base": '"limit" must be a number',
    "number.integer": '"limit" must be an integer',
    "number.min": '"limit" must be at least 1',
    "any.required": '"limit" is required',
  }),
}).required();

const sortSchema = Joi.object({
  sortBy: Joi.string().optional().messages({
    "string.base": '"sortBy" must be a string',
  }),
  sortOrder: Joi.string()
    .valid(...SORT_ORDER_VALUES)
    .optional()
    .messages({
      "any.only": `"sortOrder" must be one of [${SORT_ORDER_VALUES.join(
        ", "
      )}]`,
      "string.base": '"sortOrder" must be a string',
    }),
}).optional();

const getFamilyIncomeRecordsSchema = Joi.object({
  filters: familyIncomeFiltersSchema,
  pagination: paginationSchema,
  sort: sortSchema,
}).messages({
  "object.base": "Input must be an object",
});

module.exports = getFamilyIncomeRecordsSchema;
