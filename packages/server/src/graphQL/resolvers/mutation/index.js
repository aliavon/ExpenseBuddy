const composeResolvers = require("../composeResolvers");

const {
  addItemsSchema,
  addPurchasesSchema,
  deletePurchasesSchema,
  editItemsCategorySchema,
  updatePurchasesSchema,
  createCurrenciesSchema,
  updateCurrenciesSchema,
  deleteCurrenciesSchema,
  createIncomeTypesSchema,
  updateIncomeTypesSchema,
  deleteIncomeTypesSchema,
  withValidationCurried,
} = require("../validation");

const {
  withErrorHandlingCurried,
  defaultHandlerArgs,
} = require("../error-handling");

const addPurchases = require("./addPurchases");
const updatePurchases = require("./updatePurchases");
const deletePurchases = require("./deletePurchases");
const addItems = require("./addItems");
const editItemsCategory = require("./editItemsCategory");
const createCurrencies = require("./createCurrencies");
const updateCurrencies = require("./updateCurrencies");
const deleteCurrencies = require("./deleteCurrencies");
const createIncomeTypes = require("./createIncomeTypes");
const updateIncomeTypes = require("./updateIncomeTypes");
const deleteIncomeTypes = require("./deleteIncomeTypes");

// Helper function to compose wrappers.
// Applies withValidationCurried first, then withErrorHandlingCurried.
const withCompose = (errorHandleArg, validationArg, resolver) =>
  composeResolvers(
    withErrorHandlingCurried(errorHandleArg),
    withValidationCurried(validationArg)
  )(resolver);

// Export mutation resolvers with validation and error handling wrappers applied
module.exports = {
  // Purchase mutations
  addPurchases: withCompose(
    defaultHandlerArgs.addPurchases,
    addPurchasesSchema,
    addPurchases
  ),
  updatePurchases: withCompose(
    defaultHandlerArgs.updatePurchases,
    updatePurchasesSchema,
    updatePurchases
  ),
  deletePurchases: withCompose(
    defaultHandlerArgs.deletePurchases,
    deletePurchasesSchema,
    deletePurchases
  ),

  // Item mutations
  addItems: withCompose(defaultHandlerArgs.addItems, addItemsSchema, addItems),
  editItemsCategory: withCompose(
    defaultHandlerArgs.editItemsCategory,
    editItemsCategorySchema,
    editItemsCategory
  ),

  // Currency mutations
  createCurrencies: withCompose(
    defaultHandlerArgs.createCurrencies,
    createCurrenciesSchema,
    createCurrencies
  ),
  updateCurrencies: withCompose(
    defaultHandlerArgs.updateCurrencies,
    updateCurrenciesSchema,
    updateCurrencies
  ),
  deleteCurrencies: withCompose(
    defaultHandlerArgs.deleteCurrencies,
    deleteCurrenciesSchema,
    deleteCurrencies
  ),

  // IncomeType mutations
  createIncomeTypes: withCompose(
    defaultHandlerArgs.createIncomeTypes,
    createIncomeTypesSchema,
    createIncomeTypes
  ),
  updateIncomeTypes: withCompose(
    defaultHandlerArgs.updateIncomeTypes,
    updateIncomeTypesSchema,
    updateIncomeTypes
  ),
  deleteIncomeTypes: withCompose(
    defaultHandlerArgs.deleteIncomeTypes,
    deleteIncomeTypesSchema,
    deleteIncomeTypes
  ),
};
