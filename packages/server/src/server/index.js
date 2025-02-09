const { createSchema, createYoga } = require('graphql-yoga');

const createItemLoader = require('../loaders/itemLoader');
const schemas = require('../database/schemas');
const resolvers = require('../graphQL/resolvers');
const typeDefs = require('../graphQL/schema');
const logger = require('../logger');

module.exports = createYoga({
  context:{ schemas, logger, itemLoader: createItemLoader() },
  schema: createSchema({
    typeDefs,
    resolvers
  })
})
