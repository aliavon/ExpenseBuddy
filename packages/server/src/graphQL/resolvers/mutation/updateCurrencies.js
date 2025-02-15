const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, { updates }, { schemas: { Currency }, logger }) => {
  try {
    const bulkOperations = updates.map((update) => {
      const { id, ...fields } = update;
      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: fields },
        },
      };
    });

    await Currency.bulkWrite(bulkOperations);

    const updatedIds = updates.map(({ id }) => id);
    const updatedCurrencies = await Currency.find({ _id: { $in: updatedIds } });
    logger.info(
      { count: updatedCurrencies.length },
      "Successfully updated currencies"
    );
    return updatedCurrencies;
  } catch (error) {
    logger.error({ err: error }, "Error updating currencies");
    throw new GraphQLError(
      "Failed to update currencies. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.UPDATE_CURRENCIES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
