const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, __, { schemas: { Currency }, logger }) => {
  try {
    const currencies = await Currency.find({});
    logger.info(
      { count: currencies.length },
      "Successfully retrieved currencies"
    );

    return currencies;
  } catch (error) {
    logger.error({ err: error }, "Error retrieving currencies");
    throw new GraphQLError(
      "Failed to retrieve currencies. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.GET_CURRENCIES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
