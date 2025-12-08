const Mutation = require("./mutation");
const Query = require("./Query");
const PurchaseResolver = require("./Purchase");
const FamilyIncomeResolver = require("./FamilyIncome");
const FamilyResolver = require("./Family");
const FamilyJoinRequestResolver = require("./FamilyJoinRequest");
const UserResolver = require("./User");
const IncomeTypeResolver = require("./IncomeType");
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
  FamilyJoinRequest: FamilyJoinRequestResolver,
  User: UserResolver,
  IncomeType: IncomeTypeResolver,
};
