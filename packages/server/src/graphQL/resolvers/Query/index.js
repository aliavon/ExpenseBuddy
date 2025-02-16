const composeResolvers = require("../composeResolvers");

const {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,
  getFamilyIncomeRecordsSchema,
  withValidationCurried,
} = require("../validation");

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
  getUnits: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getUnits)
  )(getUnits),
  getCategories: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getCategories)
  )(getCategories),
  getFamilyIncomePeriodicityOptions: composeResolvers()(
    getFamilyIncomePeriodicityOptions
  ),
  getFamilyIncomeRecords: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getFamilyIncomeRecords),
    withValidationCurried(getFamilyIncomeRecordsSchema)
  )(getFamilyIncomeRecords),
  getPurchases: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getPurchases),
    withValidationCurried(getPurchasesSchema)
  )(getPurchases),
  getPurchasesCategorySuggestion: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getPurchasesCategorySuggestion),
    withValidationCurried(getPurchasesCategorySuggestionSchema)
  )(getPurchasesCategorySuggestion),
  getItems: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getItems),
    withValidationCurried(getItemsSchema)
  )(getItems),
  getCurrencies: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getCurrencies)
  )(getCurrencies),
  getIncomeTypes: composeResolvers(
    withErrorHandlingCurried(defaultHandlerArgs.getIncomeTypes)
  )(getIncomeTypes),
};
