const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { ids },
  { schemas: { IncomeType, FamilyIncome }, logger }
) => {
  try {
    const count = await FamilyIncome.countDocuments({ typeId: { $in: ids } });
    if (count > 0) {
      throw new GraphQLError(
        "One or more IncomeTypes are in use and cannot be deleted.",
        {
          extensions: { code: ERROR_CODES.INCOME_TYPE_IN_USE },
        }
      );
    }

    await IncomeType.deleteMany({ _id: { $in: ids } });
    logger.info({ count: ids.length }, "Successfully deleted income types");
    return ids;
  } catch (error) {
    logger.error({ err: error }, "Error deleting income types");
    throw new GraphQLError(
      "Failed to delete income types. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.DELETE_INCOME_TYPE_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
