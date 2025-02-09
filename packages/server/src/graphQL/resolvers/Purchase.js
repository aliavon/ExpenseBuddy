const { GraphQLError } = require('graphql');

module.exports = {
  item: async (parent, args, { schemas: { Item }, logger }) => {
    try {
      const item = await Item.findById(parent.itemId);

      if (!item) {
        logger.error({ parentId: parent.itemId }, 'Item not found');
        throw new GraphQLError(`Item not found for id ${parent.itemId}`, {
          extensions: {
            code: 'ITEM_NOT_FOUND',
          },
        });
      }

      logger.info({ itemId: parent.itemId }, 'Item retrieved successfully');
      return item;
    } catch (error) {
      logger.error({ err: error, parentId: parent.itemId }, 'Error retrieving item');
      throw new GraphQLError('Failed to retrieve item. Please try again later.', {
        extensions: {
          code: 'GET_ITEM_ERROR',
          detailedMessage: error.message,
        },
      });
    }
  }
};
