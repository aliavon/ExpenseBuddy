const composeResolvers = require("../composeResolvers");

const {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,
  getFamilyIncomeRecordsSchema,
  getUsersSchema,
  withValidationCurried,
} = require("../validation");

const {
  withErrorHandling,
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
const getUsers = require("./getUsers");

const withCompose = (errorHandleArg, validationArg, resolver) =>
  composeResolvers(
    withErrorHandlingCurried(errorHandleArg),
    withValidationCurried(validationArg)
  )(resolver);

module.exports = {
  getUnits: withErrorHandling(getUnits, defaultHandlerArgs.getUnits),
  getCategories: withErrorHandling(
    getCategories,
    defaultHandlerArgs.getCategories
  ),
  getFamilyIncomePeriodicityOptions: getFamilyIncomePeriodicityOptions,
  getFamilyIncomeRecords: withCompose(
    defaultHandlerArgs.getFamilyIncomeRecords,
    getFamilyIncomeRecordsSchema,
    getFamilyIncomeRecords
  ),
  getPurchases: withCompose(
    defaultHandlerArgs.getPurchases,
    getPurchasesSchema,
    getPurchases
  ),
  getPurchasesCategorySuggestion: withCompose(
    defaultHandlerArgs.getPurchasesCategorySuggestion,
    getPurchasesCategorySuggestionSchema,
    getPurchasesCategorySuggestion
  ),
  getItems: withCompose(defaultHandlerArgs.getItems, getItemsSchema, getItems),
  getCurrencies: withErrorHandling(
    getCurrencies,
    defaultHandlerArgs.getCurrencies
  ),
  getIncomeTypes: withErrorHandling(
    getIncomeTypes,
    defaultHandlerArgs.getIncomeTypes
  ),
  getUsers: withCompose(defaultHandlerArgs.getUsers, getUsersSchema, getUsers),
};
