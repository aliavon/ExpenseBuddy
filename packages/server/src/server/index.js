const { GraphQLServer } = require('graphql-yoga')

const resolvers = require('../graphQL/resolvers');
const schemas = require('../database/schemas');

module.exports = new GraphQLServer({
  typeDefs: './src/graphQL/schema.graphql',
  resolvers,
  context: { schemas },
});
