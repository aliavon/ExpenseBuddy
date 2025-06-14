const validationExports = require("../index");

describe("Validation index exports", () => {
  it("should export all purchase-related schemas", () => {
    expect(validationExports.getItemsSchema).toBeDefined();
    expect(validationExports.getPurchasesSchema).toBeDefined();
    expect(validationExports.getPurchasesCategorySuggestionSchema).toBeDefined();
    expect(validationExports.addItemsSchema).toBeDefined();
    expect(validationExports.addPurchasesSchema).toBeDefined();
    expect(validationExports.deletePurchasesSchema).toBeDefined();
    expect(validationExports.editItemsCategorySchema).toBeDefined();
    expect(validationExports.updatePurchasesSchema).toBeDefined();
  });

  it("should export all family income schemas", () => {
    expect(validationExports.getFamilyIncomeRecordsSchema).toBeDefined();
    expect(validationExports.createFamilyIncomesSchema).toBeDefined();
    expect(validationExports.updateFamilyIncomesSchema).toBeDefined();
    expect(validationExports.deleteFamilyIncomesSchema).toBeDefined();
  });

  it("should export all currency schemas", () => {
    expect(validationExports.createCurrenciesSchema).toBeDefined();
    expect(validationExports.updateCurrenciesSchema).toBeDefined();
    expect(validationExports.deleteCurrenciesSchema).toBeDefined();
  });

  it("should export all income type schemas", () => {
    expect(validationExports.createIncomeTypesSchema).toBeDefined();
    expect(validationExports.updateIncomeTypesSchema).toBeDefined();
    expect(validationExports.deleteIncomeTypesSchema).toBeDefined();
  });

  it("should export all user schemas", () => {
    expect(validationExports.createUserSchema).toBeDefined();
    expect(validationExports.updateUserSchema).toBeDefined();
    expect(validationExports.deleteUserSchema).toBeDefined();
    expect(validationExports.getUsersSchema).toBeDefined();
  });

  it("should export validation helpers", () => {
    expect(validationExports.withValidation).toBeDefined();
    expect(validationExports.withValidationCurried).toBeDefined();
  });

  it("should export the correct number of schemas", () => {
    const exportKeys = Object.keys(validationExports);
    expect(exportKeys).toHaveLength(24);
  });

  it("should have all exports as functions or objects", () => {
    Object.values(validationExports).forEach((exportedItem) => {
      expect(typeof exportedItem === 'function' || typeof exportedItem === 'object').toBe(true);
    });
  });
}); 