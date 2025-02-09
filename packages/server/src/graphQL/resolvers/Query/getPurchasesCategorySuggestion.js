const { GraphQLError } = require('graphql');

module.exports = async (_, { names }, { schemas: { Item }, logger }) => {
  try {
    const items = await Item.find({ name: { $in: names } });
    const itemsByName = {};
    items.forEach(item => {
      itemsByName[item.name] = item;
    });
    const result = names.map(name => ({
      name,
      category: itemsByName[name] ? itemsByName[name].category : null,
    }));
    logger.info({ count: result.length }, 'Successfully retrieved purchases category suggestion');
    return result;
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving purchases category suggestion');
    throw new GraphQLError('Failed to retrieve purchases category suggestion. Please try again later.', {
      extensions: {
        code: 'GET_PURCHASES_CATEGORY_SUGGESTION_ERROR',
        detailedMessage: error.message,
      },
    });
  }
};