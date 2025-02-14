const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { purchases },
  { schemas: { Purchase }, logger }
) => {
  try {
    const newPurchases = await Purchase.insertMany(purchases);
    logger.info({ count: newPurchases.length }, "Successfully added purchases");
    return newPurchases;
  } catch (error) {
    logger.error({ err: error }, "Error adding purchases");
    throw new GraphQLError(
      error.message || "Failed to add purchases. Please try again later.",
      {
        extensions: {
          code: error.extensions?.code || ERROR_CODES.ADD_PURCHASES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
