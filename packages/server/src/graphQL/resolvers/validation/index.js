const addItemsSchema = require("./addItemsSchema");
const addPurchasesSchema = require("./addPurchasesSchema");
const deletePurchasesSchema = require("./deletePurchasesSchema");
const editItemsCategorySchema = require("./editItemsCategorySchema");
const updatePurchasesSchema = require("./updatePurchasesSchema");

const getItemsSchema = require("./getItemsSchema");
const getPurchasesSchema = require("./getPurchasesSchema");
const getPurchasesCategorySuggestionSchema = require("./getPurchasesCategorySuggestionSchema");

// FamilyIncomes
const getFamilyIncomeRecordsSchema = require("./getFamilyIncomeRecordsSchema");
const createFamilyIncomesSchema = require("./createFamilyIncomesSchema");
const updateFamilyIncomesSchema = require("./updateFamilyIncomesSchema");
const deleteFamilyIncomesSchema = require("./deleteFamilyIncomesSchema");

// Currency
const createCurrenciesSchema = require("./createCurrenciesSchema");
const updateCurrenciesSchema = require("./updateCurrenciesSchema");
const deleteCurrenciesSchema = require("./deleteCurrenciesSchema");

//IncomeType
const createIncomeTypesSchema = require("./createIncomeTypesSchema");
const updateIncomeTypesSchema = require("./updateIncomeTypesSchema");
const deleteIncomeTypesSchema = require("./deleteIncomeTypesSchema");

// User
const createUserSchema = require("./createUserSchema");
const updateUserSchema = require("./updateUserSchema");
const deleteUserSchema = require("./deleteUserSchema");
const getUsersSchema = require("./getUsersSchema");

const withValidation = require("./withValidation");
const withValidationCurried = require("./withValidationCurried");

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
  createFamilyIncomesSchema,
  updateFamilyIncomesSchema,
  deleteFamilyIncomesSchema,

  createCurrenciesSchema,
  updateCurrenciesSchema,
  deleteCurrenciesSchema,

  createIncomeTypesSchema,
  updateIncomeTypesSchema,
  deleteIncomeTypesSchema,

  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  getUsersSchema,

  withValidation,
  withValidationCurried,
};
