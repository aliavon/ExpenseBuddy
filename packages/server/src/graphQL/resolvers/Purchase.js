const { GraphQLError } = require('graphql');

module.exports = {
  item: async (parent, _, { logger, itemLoader }) => {
    try {
      const item = await itemLoader.load(parent.itemId);

      if (!item) {
        logger.error({ parentId: parent.itemId }, 'Item not found');
        throw new GraphQLError(`Item not found for id ${parent.itemId}`, {
          extensions: {
            code: 'ITEM_NOT_FOUND',
          },
        });
      }

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
