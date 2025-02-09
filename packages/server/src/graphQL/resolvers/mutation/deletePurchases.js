const { GraphQLError } = require("graphql");

module.exports = async (_, { ids }, { schemas: { Purchase }, logger }) => {
  try {
    await Purchase.deleteMany({ _id: { $in: ids } });
    logger.info({ count: ids.length }, "Successfully deleted purchases");
    return ids;
  } catch (error) {
    logger.error({ err: error }, "Error deleting purchases");
    throw new GraphQLError(
      "Failed to delete purchases. Please try again later.",
      {
        extensions: {
          code: "DELETE_PURCHASES_ERROR",
          detailedMessage: error.message,
        },
      }
    );
  }
};
