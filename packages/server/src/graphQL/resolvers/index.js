const Mutation = require("./mutation");
const Query = require("./Query");
const PurchaseResolver = require("./Purchase");
const FamilyIncomeResolver = require("./FamilyIncome");

module.exports = {
  Mutation,
  Query,
  Purchase: PurchaseResolver,
  FamilyIncome: FamilyIncomeResolver,
};
