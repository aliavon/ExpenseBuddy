const {
  getItemsSchema,
  getPurchasesSchema,
  getPurchasesCategorySuggestionSchema,
  withValidation,
} = require("../../../validation");

const getPurchases = require("./getPurchases");
const getCategories = require("./getCategories");
const getUnits = require("./getUnits");
const getPurchasesCategorySuggestion = require("./getPurchasesCategorySuggestion");
const getItems = require("./getItems");
const getFamilyIncomePeriodicityOptions = require("./getFamilyIncomePeriodicityOptions");

module.exports = {
  getUnits,
  getCategories,
  getFamilyIncomePeriodicityOptions,
  getPurchases: withValidation(getPurchasesSchema, getPurchases),
  getPurchasesCategorySuggestion: withValidation(
    getPurchasesCategorySuggestionSchema,
    getPurchasesCategorySuggestion
  ),
  getItems: withValidation(getItemsSchema, getItems),
};
