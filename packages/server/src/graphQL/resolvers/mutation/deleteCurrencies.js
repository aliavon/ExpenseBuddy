const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { ids },
  { schemas: { Currency, FamilyIncome }, logger }
) => {
  try {
    const usedCount = await FamilyIncome.countDocuments({
      currencyId: { $in: ids },
    });
    if (usedCount > 0) {
      throw new GraphQLError(
        "One or more currencies are in use and cannot be deleted.",
        { extensions: { code: ERROR_CODES.CURRENCY_IN_USE } }
      );
    }

    await Currency.deleteMany({ _id: { $in: ids } });
    logger.info({ count: ids.length }, "Successfully deleted currencies");
    return ids;
  } catch (error) {
    logger.error({ err: error }, "Error deleting currencies");
    if (error.extensions && error.extensions.code) {
      throw error;
    }
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
