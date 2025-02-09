const { GraphQLError } = require('graphql');

module.exports = async (_, { items }, { schemas: { Item }, logger }) => {
  try {
    const newItems = await Item.insertMany(items);
    logger.info({ count: newItems.length }, 'Successfully added items');
    return newItems;
  } catch (error) {
    logger.error({ err: error }, 'Error adding items');
    throw new GraphQLError('Failed to add items. Please try again later.', {
      extensions: {
        code: 'ADD_ITEMS_ERROR',
        detailedMessage: error.message,
      },
    });
  }
};