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
};
