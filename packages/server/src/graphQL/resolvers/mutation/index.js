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
  withValidation,
} = require("../validation");

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

module.exports = {
  addPurchases: withValidation(addPurchasesSchema, addPurchases),
  updatePurchases: withValidation(updatePurchasesSchema, updatePurchases),
  deletePurchases: withValidation(deletePurchasesSchema, deletePurchases),
  addItems: withValidation(addItemsSchema, addItems),
  editItemsCategory: withValidation(editItemsCategorySchema, editItemsCategory),

  createCurrencies: withValidation(createCurrenciesSchema, createCurrencies),
  updateCurrencies: withValidation(updateCurrenciesSchema, updateCurrencies),
  deleteCurrencies: withValidation(deleteCurrenciesSchema, deleteCurrencies),

  createIncomeTypes: withValidation(createIncomeTypesSchema, createIncomeTypes),
  updateIncomeTypes: withValidation(updateIncomeTypesSchema, updateIncomeTypes),
  deleteIncomeTypes: withValidation(deleteIncomeTypesSchema, deleteIncomeTypes),
};
