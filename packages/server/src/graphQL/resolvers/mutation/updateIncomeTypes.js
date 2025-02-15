const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { updates },
  { schemas: { IncomeType }, logger }
) => {
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

    await IncomeType.bulkWrite(bulkOperations);

    const updatedIds = updates.map(({ id }) => id);
    const updatedIncomeTypes = await IncomeType.find({
      _id: { $in: updatedIds },
    });
    logger.info(
      { count: updatedIncomeTypes.length },
      "Successfully updated income types"
    );
    return updatedIncomeTypes;
  } catch (error) {
    logger.error({ err: error }, "Error updating income types");
    throw new GraphQLError(
      "Failed to update income types. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.UPDATE_INCOME_TYPE_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
