const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, { ids }, { schemas: { Currency }, logger }) => {
  try {
    await Currency.deleteMany({ _id: { $in: ids } });
    logger.info({ count: ids.length }, "Successfully deleted currencies");
    return ids;
  } catch (error) {
    logger.error({ err: error }, "Error deleting currencies");
    throw new GraphQLError(
      "Failed to delete currencies. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.DELETE_CURRENCIES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
