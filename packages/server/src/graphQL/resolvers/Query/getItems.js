const { GraphQLError } = require('graphql');

module.exports = async (_, { names, category }, { schemas: { Item }, logger }) => {
  try {
    const filter = {};
    if (names && names.length > 0) {
      filter.name = { $in: names };
    }
    if (category && category.trim() !== '') {
      filter.category = category;
    }
    const items = await Item.find(filter);
    logger.info({ count: items.length }, 'Successfully retrieved items');
    return items;
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving items');
    throw new GraphQLError('Failed to retrieve items. Please try again later.', {
      extensions: {
        code: 'GET_ITEMS_ERROR',
        detailedMessage: error.message,
      },
    });
  }
};