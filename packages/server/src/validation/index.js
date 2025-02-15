const addItemsSchema = require("./addItemsSchema");
const addPurchasesSchema = require("./addPurchasesSchema");
const deletePurchasesSchema = require("./deletePurchasesSchema");
const editItemsCategorySchema = require("./editItemsCategorySchema");
const updatePurchasesSchema = require("./updatePurchasesSchema");

const getItemsSchema = require("./getItemsSchema");
const getPurchasesSchema = require("./getPurchasesSchema");
const getPurchasesCategorySuggestionSchema = require("./getPurchasesCategorySuggestionSchema");

const getFamilyIncomeRecordsSchema = require("./getFamilyIncomeRecordsSchema");

// Currency
const createCurrenciesSchema = require("./createCurrenciesSchema");
const updateCurrenciesSchema = require("./updateCurrenciesSchema");
const deleteCurrenciesSchema = require("./deleteCurrenciesSchema");

const withValidation = require("./withValidation");

module.exports = {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,

  addItemsSchema,
  addPurchasesSchema,
  deletePurchasesSchema,
  editItemsCategorySchema,
  updatePurchasesSchema,

  getFamilyIncomeRecordsSchema,

  createCurrenciesSchema,
  updateCurrenciesSchema,
  deleteCurrenciesSchema,

  withValidation,
};
