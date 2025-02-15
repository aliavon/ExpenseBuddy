const { createSchema, createYoga } = require("graphql-yoga");

const createItemLoader = require("../loaders/itemLoader");
const createIncomeTypeLoader = require("../loaders/incomeTypeLoader");
const createUserLoader = require("../loaders/userLoader");
const createCurrencyLoader = require("../loaders/currencyLoader");

const schemas = require("../database/schemas");
const resolvers = require("../graphQL/resolvers");
const typeDefs = require("../graphQL/schema");
const logger = require("../logger");

module.exports = createYoga({
  context: {
    schemas,
    logger,
    loaders: {
      itemLoader: createItemLoader(),
      incomeTypeLoader: createIncomeTypeLoader(),
      userLoader: createUserLoader(),
      currencyLoader: createCurrencyLoader(),
    },
  },
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
});
