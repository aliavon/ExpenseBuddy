const { createSchema, createYoga } = require("graphql-yoga");

const createItemLoader = require("../loaders/itemLoader");
const createIncomeTypeLoader = require("../loaders/incomeTypeLoader");
const createUserLoader = require("../loaders/userLoader");
const createCurrencyLoader = require("../loaders/currencyLoader");

const schemas = require("../database/schemas");
const resolvers = require("../graphQL/resolvers");
const typeDefs = require("../graphQL/schema");
const logger = require("../logger");
const { enhanceContextWithAuth } = require("../auth");

module.exports = createYoga({
  context: async (params) => {
    // Base context with existing services
    const baseContext = {
      schemas,
      logger,
      loaders: {
        itemLoader: createItemLoader(),
        incomeTypeLoader: createIncomeTypeLoader(),
        userLoader: createUserLoader(),
        currencyLoader: createCurrencyLoader(),
      },
    };

    // Enhance context with authentication
    return enhanceContextWithAuth(params.request, baseContext);
  },
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
});
