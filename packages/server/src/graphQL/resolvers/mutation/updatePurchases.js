const { GraphQLError } = require("graphql");

module.exports = async (_, { updates }, { schemas: { Purchase }, logger }) => {
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

    await Purchase.bulkWrite(bulkOperations);

    const updatedIds = updates.map(({ id }) => id);
    const updatedPurchases = await Purchase.find({ _id: { $in: updatedIds } });
    logger.info(
      { count: updatedPurchases.length },
      "Successfully updated purchases"
    );

    return updatedPurchases;
  } catch (error) {
    logger.error({ err: error }, "Error updating purchases");
    throw new GraphQLError(
      "Failed to update purchases. Please try again later.",
      {
        extensions: {
          code: "UPDATE_PURCHASES_ERROR",
          detailedMessage: error.message,
        },
      }
    );
  }
};
