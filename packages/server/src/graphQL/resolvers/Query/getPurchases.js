const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, { from, to }, { schemas: { Purchase }, logger }) => {
  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const purchases = await Purchase.find({
      date: { $gte: fromDate, $lte: toDate },
    });
    logger.info(
      { count: purchases.length },
      "Successfully retrieved purchases"
    );
    return purchases;
  } catch (error) {
    logger.error({ err: error }, "Error retrieving purchases");
    throw new GraphQLError(
      "Failed to retrieve purchases. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.GET_PURCHASES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
