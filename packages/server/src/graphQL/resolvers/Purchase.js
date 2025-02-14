const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../constants/errorCodes");

module.exports = {
  item: async (parent, _, { logger, loaders: { itemLoader } }) => {
    try {
      const item = await itemLoader.load(parent.itemId);

      if (!item) {
        logger.error({ parentId: parent.itemId }, "Item not found");
        throw new GraphQLError(`Item not found for id ${parent.itemId}`, {
          extensions: {
            code: ERROR_CODES.ITEM_NOT_FOUND,
          },
        });
      }

      return item;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.itemId },
        "Error retrieving item"
      );
      throw new GraphQLError(
        "Failed to retrieve item. Please try again later.",
        {
          extensions: {
            code: error.extensions?.code || ERROR_CODES.GET_ITEM_ERROR,
            detailedMessage: error.message,
          },
        }
      );
    }
  },
};
