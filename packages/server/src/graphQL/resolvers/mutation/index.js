const { withValidation, addPurchasesSchema } = require('../../../validation');

const addPurchases = require('./addPurchases');
const updatePurchases = require('./updatePurchases');
const deletePurchases = require('./deletePurchases');
const addItems = require('./addItems');
const editItemsCategory = require('./editItemsCategory');

module.exports = {
  addPurchases: withValidation(addPurchasesSchema, addPurchases),
  updatePurchases,
  deletePurchases,
  addItems,
  editItemsCategory,
};
