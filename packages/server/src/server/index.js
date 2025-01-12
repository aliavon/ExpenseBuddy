const { createSchema, createYoga } = require('graphql-yoga');

const resolvers = require('../graphQL/resolvers');
const schemas = require('../database/schemas');
const typeDefs = require('../graphQL/schema');

module.exports = createYoga({
  context:{ schemas },
  schema: createSchema({
    typeDefs,
    resolvers
  })
})
