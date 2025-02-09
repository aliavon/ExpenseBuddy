const { createSchema, createYoga } = require('graphql-yoga');

const resolvers = require('../graphQL/resolvers');
const schemas = require('../database/schemas');
const typeDefs = require('../graphQL/schema');
const logger = require('../logger');

module.exports = createYoga({
  context:{ schemas, logger },
  schema: createSchema({
    typeDefs,
    resolvers
  })
})
