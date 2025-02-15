const {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,
  getFamilyIncomeRecordsSchema,
  withValidation,
} = require("../../../validation");

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
  getCategories,
  getFamilyIncomePeriodicityOptions,
  getFamilyIncomeRecords: withValidation(
    getFamilyIncomeRecordsSchema,
    getFamilyIncomeRecords
  ),
  getPurchases: withValidation(getPurchasesSchema, getPurchases),
  getPurchasesCategorySuggestion: withValidation(
    getPurchasesCategorySuggestionSchema,
    getPurchasesCategorySuggestion
  ),
  getItems: withValidation(getItemsSchema, getItems),
  getCurrencies,
  getIncomeTypes,
};
