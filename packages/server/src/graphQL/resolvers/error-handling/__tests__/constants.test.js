const errorHandlingConstants = require("../constants");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("Error Handling Constants", () => {
  it("should export all required error configurations", () => {
    const expectedKeys = [
      "getPurchases",
      "getCategories", 
      "getCurrencies",
      "getFamilyIncomeRecords",
      "getIncomeTypes",
      "createCurrencies",
      "updateCurrencies",
      "deleteCurrencies",
      "createIncomeTypes",
      "updateIncomeTypes",
      "deleteIncomeTypes",
      "getPurchasesCategorySuggestion",
      "getItems",
      "getUnits",
      "addPurchases",
      "updatePurchases",
      "deletePurchases",
      "addItems",
      "editItemsCategory",
      "getUsers",
      "createUser",
      "updateUser",
      "deleteUser",
      "createFamilyIncomes",
      "updateFamilyIncomes",
      "deleteFamilyIncomes"
    ];

    expectedKeys.forEach(key => {
      expect(errorHandlingConstants).toHaveProperty(key);
    });
  });

  it("should have correct structure for each error configuration", () => {
    Object.values(errorHandlingConstants).forEach(config => {
      expect(config).toHaveProperty("defaultErrorCode");
      expect(config).toHaveProperty("defaultErrorMessage");
      expect(typeof config.defaultErrorCode).toBe("string");
      expect(typeof config.defaultErrorMessage).toBe("string");
      expect(config.defaultErrorCode.length).toBeGreaterThan(0);
      expect(config.defaultErrorMessage.length).toBeGreaterThan(0);
    });
  });

  it("should use valid error codes from ERROR_CODES constants", () => {
    const validErrorCodes = Object.values(ERROR_CODES);
    
    Object.values(errorHandlingConstants).forEach(config => {
      expect(validErrorCodes).toContain(config.defaultErrorCode);
    });
  });

  it("should have meaningful error messages", () => {
    Object.entries(errorHandlingConstants).forEach(([key, config]) => {
      expect(config.defaultErrorMessage).toMatch(/Failed to|Error/);
      expect(config.defaultErrorMessage).toMatch(/Please try again later/);
    });
  });

  describe("specific error configurations", () => {
    it("should have correct getPurchases configuration", () => {
      expect(errorHandlingConstants.getPurchases).toEqual({
        defaultErrorCode: ERROR_CODES.GET_PURCHASES_ERROR,
        defaultErrorMessage: "Failed to retrieve purchases. Please try again later."
      });
    });

    it("should have correct createCurrencies configuration", () => {
      expect(errorHandlingConstants.createCurrencies).toEqual({
        defaultErrorCode: ERROR_CODES.ADD_CURRENCIES_ERROR,
        defaultErrorMessage: "Failed to add currencies. Please try again later."
      });
    });

    it("should have correct deleteUser configuration", () => {
      expect(errorHandlingConstants.deleteUser).toEqual({
        defaultErrorCode: ERROR_CODES.DELETE_USER_ERROR,
        defaultErrorMessage: "Failed to delete user. Please try again later."
      });
    });

    it("should have correct getFamilyIncomeRecords configuration", () => {
      expect(errorHandlingConstants.getFamilyIncomeRecords).toEqual({
        defaultErrorCode: ERROR_CODES.GET_FAMILY_INCOME_ERROR,
        defaultErrorMessage: "Failed to retrieve family income records. Please try again later."
      });
    });
  });

  it("should not have duplicate error codes", () => {
    const errorCodes = Object.values(errorHandlingConstants).map(config => config.defaultErrorCode);
    const uniqueErrorCodes = [...new Set(errorCodes)];
    
    expect(errorCodes.length).toBe(uniqueErrorCodes.length);
  });

  it("should have consistent message format", () => {
    Object.values(errorHandlingConstants).forEach(config => {
      expect(config.defaultErrorMessage).toMatch(/^Failed to .+\. Please try again later\.$/);
    });
  });
}); 