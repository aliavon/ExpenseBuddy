const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, __, { schemas: { IncomeType }, logger }) => {
  try {
    const incomeTypes = await IncomeType.find({});
    logger.info(
      { count: incomeTypes.length },
      "Successfully retrieved income types"
    );
    return incomeTypes;
  } catch (error) {
    logger.error({ err: error }, "Error retrieving income types");
    throw new GraphQLError(
      "Failed to retrieve income types. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.GET_INCOME_TYPES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
