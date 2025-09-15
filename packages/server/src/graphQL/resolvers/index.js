const Mutation = require("./mutation");
const Query = require("./Query");
const PurchaseResolver = require("./Purchase");
const FamilyIncomeResolver = require("./FamilyIncome");
const FamilyResolver = require("./Family");
const UserResolver = require("./User");
const authResolvers = require("./auth");
const protectedResolvers = require("./protected");

module.exports = {
  Query: {
    ...Query,
    ...protectedResolvers,
  },
  Mutation: {
    ...Mutation,
    ...authResolvers,
  },
  Purchase: PurchaseResolver,
  FamilyIncome: FamilyIncomeResolver,
  Family: FamilyResolver,
  User: UserResolver,
};
