const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = {
  getPurchases: {
    defaultErrorCode: ERROR_CODES.GET_PURCHASES_ERROR,
    defaultErrorMessage:
      "Failed to retrieve purchases. Please try again later.",
  },
  getCategories: {
    defaultErrorCode: ERROR_CODES.GET_CATEGORIES_ERROR,
    defaultErrorMessage:
      "Failed to retrieve categories. Please try again later.",
  },
  getCurrencies: {
    defaultErrorCode: ERROR_CODES.GET_CURRENCIES_ERROR,
    defaultErrorMessage:
      "Failed to retrieve currencies. Please try again later.",
  },
  getFamilyIncomeRecords: {
    defaultErrorCode: ERROR_CODES.GET_FAMILY_INCOME_ERROR,
    defaultErrorMessage:
      "Failed to retrieve family income records. Please try again later.",
  },
  getIncomeTypes: {
    defaultErrorCode: ERROR_CODES.GET_INCOME_TYPES_ERROR,
    defaultErrorMessage:
      "Failed to retrieve income types. Please try again later.",
  },
  createCurrencies: {
    defaultErrorCode: ERROR_CODES.ADD_CURRENCIES_ERROR,
    defaultErrorMessage: "Failed to add currencies. Please try again later.",
  },
  updateCurrencies: {
    defaultErrorCode: ERROR_CODES.UPDATE_CURRENCIES_ERROR,
    defaultErrorMessage: "Failed to update currencies. Please try again later.",
  },
  deleteCurrencies: {
    defaultErrorCode: ERROR_CODES.DELETE_CURRENCIES_ERROR,
    defaultErrorMessage: "Failed to delete currencies. Please try again later.",
  },
  createIncomeTypes: {
    defaultErrorCode: ERROR_CODES.ADD_INCOME_TYPE_ERROR,
    defaultErrorMessage: "Failed to add income types. Please try again later.",
  },
  updateIncomeTypes: {
    defaultErrorCode: ERROR_CODES.UPDATE_INCOME_TYPE_ERROR,
    defaultErrorMessage:
      "Failed to update income types. Please try again later.",
  },
  deleteIncomeTypes: {
    defaultErrorCode: ERROR_CODES.DELETE_INCOME_TYPE_ERROR,
    defaultErrorMessage:
      "Failed to delete income types. Please try again later.",
  },
  getPurchasesCategorySuggestion: {
    defaultErrorCode: ERROR_CODES.GET_PURCHASES_CATEGORY_SUGGESTION_ERROR,
    defaultErrorMessage:
      "Failed to retrieve purchases category suggestion. Please try again later.",
  },
  getItems: {
    defaultErrorCode: ERROR_CODES.GET_ITEMS_ERROR,
    defaultErrorMessage: "Failed to retrieve items. Please try again later.",
  },
  getUnits: {
    defaultErrorCode: ERROR_CODES.GET_UNITS_ERROR,
    defaultErrorMessage: "Failed to retrieve units. Please try again later.",
  },
  addPurchases: {
    defaultErrorCode: ERROR_CODES.ADD_PURCHASES_ERROR,
    defaultErrorMessage: "Failed to add purchases. Please try again later.",
  },
  updatePurchases: {
    defaultErrorCode: ERROR_CODES.UPDATE_PURCHASES_ERROR,
    defaultErrorMessage: "Failed to update purchases. Please try again later.",
  },
  deletePurchases: {
    defaultErrorCode: ERROR_CODES.DELETE_PURCHASES_ERROR,
    defaultErrorMessage: "Failed to delete purchases. Please try again later.",
  },
  addItems: {
    defaultErrorCode: ERROR_CODES.ADD_ITEMS_ERROR,
    defaultErrorMessage: "Failed to add items. Please try again later.",
  },
  editItemsCategory: {
    defaultErrorCode: ERROR_CODES.EDIT_ITEMS_CATEGORY_ERROR,
    defaultErrorMessage:
      "Failed to update items category. Please try again later.",
  },
  getUsers: {
    defaultErrorCode: ERROR_CODES.GET_USERS_ERROR,
    defaultErrorMessage: "Failed to retrieve users. Please try again later.",
  },
  createUser: {
    defaultErrorCode: ERROR_CODES.ADD_USER_ERROR,
    defaultErrorMessage: "Failed to create user. Please try again later.",
  },
  updateUser: {
    defaultErrorCode: ERROR_CODES.UPDATE_USER_ERROR,
    defaultErrorMessage: "Failed to update user. Please try again later.",
  },
  deleteUser: {
    defaultErrorCode: ERROR_CODES.DELETE_USER_ERROR,
    defaultErrorMessage: "Failed to delete user. Please try again later.",
  },
};
