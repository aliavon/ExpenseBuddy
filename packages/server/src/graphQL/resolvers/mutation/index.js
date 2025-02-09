const {
  addItemsSchema,
  addPurchasesSchema,
  deletePurchasesSchema,
  editItemsCategorySchema,
  updatePurchasesSchema,
  withValidation,
} = require("../../../validation");

const addPurchases = require("./addPurchases");
const updatePurchases = require("./updatePurchases");
const deletePurchases = require("./deletePurchases");
const addItems = require("./addItems");
const editItemsCategory = require("./editItemsCategory");

module.exports = {
  addPurchases: withValidation(addPurchasesSchema, addPurchases),
  updatePurchases: withValidation(updatePurchasesSchema, updatePurchases),
  deletePurchases: withValidation(deletePurchasesSchema, deletePurchases),
  addItems: withValidation(addItemsSchema, addItems),
  editItemsCategory: withValidation(editItemsCategorySchema, editItemsCategory),
};
