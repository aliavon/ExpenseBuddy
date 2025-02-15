const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { incomeTypes },
  { schemas: { IncomeType }, logger }
) => {
  try {
    const newIncomeTypes = await IncomeType.insertMany(incomeTypes);
    logger.info(
      { count: newIncomeTypes.length },
      "Successfully added income types"
    );
    return newIncomeTypes;
  } catch (error) {
    logger.error({ err: error }, "Error adding income types");
    throw new GraphQLError(
      "Failed to add income types. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.ADD_INCOME_TYPE_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
