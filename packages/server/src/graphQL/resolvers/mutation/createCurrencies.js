const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { currencies },
  { schemas: { Currency }, logger }
) => {
  try {
    const newCurrencies = await Currency.insertMany(currencies);
    logger.info(
      { count: newCurrencies.length },
      "Successfully added currencies"
    );
    return newCurrencies;
  } catch (error) {
    logger.error({ err: error }, "Error adding currencies");
    throw new GraphQLError(
      "Failed to add currencies. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.ADD_CURRENCIES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
