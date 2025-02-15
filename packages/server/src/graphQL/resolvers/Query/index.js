const composeResolvers = require("../composeResolvers");

const {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,
  getFamilyIncomeRecordsSchema,
  withValidation,
  withValidationCurried,
} = require("../../../validation");

const {
  withErrorHandlingCurried,
  defaultHandlerArgs,
} = require("../error-handling");

const getPurchases = require("./getPurchases");
const getCategories = require("./getCategories");
const getUnits = require("./getUnits");
const getPurchasesCategorySuggestion = require("./getPurchasesCategorySuggestion");
const getItems = require("./getItems");
const getFamilyIncomePeriodicityOptions = require("./getFamilyIncomePeriodicityOptions");
const getFamilyIncomeRecords = require("./getFamilyIncomeRecords");
const getCurrencies = require("./getCurrencies");
const getIncomeTypes = require("./getIncomeTypes");

module.exports = {
  getUnits,
  getCategories: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getCategories)
  )(getCategories),
  getFamilyIncomePeriodicityOptions,
  getFamilyIncomeRecords: withValidation(
    getFamilyIncomeRecordsSchema,
    getFamilyIncomeRecords
  ),
  getPurchases: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getPurchases),
    withValidationCurried(getPurchasesSchema)
  )(getPurchases),
  getPurchasesCategorySuggestion: withValidation(
    getPurchasesCategorySuggestionSchema,
    getPurchasesCategorySuggestion
  ),
  getItems: withValidation(getItemsSchema, getItems),
  getCurrencies,
  getIncomeTypes,
};
