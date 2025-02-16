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

// Helper function to compose both validation and error handling wrappers.
// It applies withValidationCurried first, then withErrorHandlingCurried.
const withCompose = (errorHandleArg, validationArg, resolver) =>
  composeResolvers(
    withErrorHandlingCurried(errorHandleArg),
    withValidationCurried(validationArg)
  )(resolver);

// Purchase-related queries
const purchasesResolvers = {
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
};

// Item-related queries
const itemsResolvers = {
  getItems: withCompose(defaultHandlerArgs.getItems, getItemsSchema, getItems),
  getCategories: withErrorHandling(
    getCategories,
    defaultHandlerArgs.getCategories
  ),
  getUnits: withErrorHandling(getUnits, defaultHandlerArgs.getUnits),
};

// FamilyIncome-related queries
const familyIncomeResolvers = {
  getFamilyIncomePeriodicityOptions: getFamilyIncomePeriodicityOptions, // No validation/error handling needed
  getFamilyIncomeRecords: withCompose(
    defaultHandlerArgs.getFamilyIncomeRecords,
    getFamilyIncomeRecordsSchema,
    getFamilyIncomeRecords
  ),
};

// Currency-related queries
const currencyResolvers = {
  getCurrencies: withErrorHandling(
    getCurrencies,
    defaultHandlerArgs.getCurrencies
  ),
};

// IncomeType-related queries
const incomeTypeResolvers = {
  getIncomeTypes: withErrorHandling(
    getIncomeTypes,
    defaultHandlerArgs.getIncomeTypes
  ),
};

// User-related queries
const userResolvers = {
  getUsers: withCompose(defaultHandlerArgs.getUsers, getUsersSchema, getUsers),
};

// Export all grouped Query resolvers
module.exports = {
  ...purchasesResolvers,
  ...itemsResolvers,
  ...familyIncomeResolvers,
  ...currencyResolvers,
  ...incomeTypeResolvers,
  ...userResolvers,
};
