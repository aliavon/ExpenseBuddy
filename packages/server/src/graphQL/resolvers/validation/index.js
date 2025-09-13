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

// Authentication
const registerSchema = require("./registerSchema");
const loginSchema = require("./loginSchema");
const refreshTokenSchema = require("./refreshTokenSchema");
const verifyEmailSchema = require("./verifyEmailSchema");
const sendVerificationEmailSchema = require("./sendVerificationEmailSchema");
const requestPasswordResetSchema = require("./requestPasswordResetSchema");
const resetPasswordSchema = require("./resetPasswordSchema");
const changePasswordSchema = require("./changePasswordSchema");

// Family Management
const createFamilySchema = require("./createFamilySchema");
const updateFamilySchema = require("./updateFamilySchema");
const joinFamilyByCodeSchema = require("./joinFamilyByCodeSchema");

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

  // Authentication schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  sendVerificationEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,

  // Family Management schemas
  createFamilySchema,
  updateFamilySchema,
  joinFamilyByCodeSchema,

  withValidation,
  withValidationCurried,
};
