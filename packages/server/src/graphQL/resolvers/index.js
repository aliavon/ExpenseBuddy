const Mutation = require("./mutation");
const Query = require("./Query");
const PurchaseResolver = require("./Purchase");

module.exports = {
  Mutation,
  Query,
  Purchase: PurchaseResolver,
};
