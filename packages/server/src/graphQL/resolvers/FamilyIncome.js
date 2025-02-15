const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../constants/errorCodes");

module.exports = {
  type: async (parent, _, { logger, loaders: { incomeTypeLoader } }) => {
    try {
      const incomeType = await incomeTypeLoader.load(parent.typeId.toString());
      if (!incomeType) {
        logger.error({ parentId: parent.typeId }, "IncomeType not found");
        throw new GraphQLError(`IncomeType not found for id ${parent.typeId}`, {
          extensions: { code: ERROR_CODES.INCOME_TYPE_NOT_FOUND },
        });
      }
      return incomeType;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.typeId },
        "Error retrieving IncomeType"
      );
      throw new GraphQLError(
        "Failed to retrieve IncomeType. Please try again later.",
        {
          extensions: {
            code: error.extensions?.code || ERROR_CODES.GET_INCOME_TYPE_ERROR,
            detailedMessage: error.message,
          },
        }
      );
    }
  },

  contributor: async (parent, _, { logger, loaders: { userLoader } }) => {
    try {
      const user = await userLoader.load(parent.contributorId.toString());
      if (!user) {
        logger.error({ parentId: parent.contributorId }, "User not found");
        throw new GraphQLError(
          `User not found for id ${parent.contributorId}`,
          { extensions: { code: ERROR_CODES.USER_NOT_FOUND } }
        );
      }
      return user;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.contributorId },
        "Error retrieving User"
      );
      throw new GraphQLError(
        "Failed to retrieve user. Please try again later.",
        {
          extensions: {
            code: error.extensions?.code || ERROR_CODES.GET_USER_ERROR,
            detailedMessage: error.message,
          },
        }
      );
    }
  },
  currency: async (parent, _, { logger, loaders: { currencyLoader } }) => {
    try {
      const currency = await currencyLoader.load(parent.currencyId.toString());
      if (!currency) {
        logger.error({ parentId: parent.currencyId }, "Currency not found");
        throw new GraphQLError(
          `Currency not found for id ${parent.currencyId}`,
          {
            extensions: { code: ERROR_CODES.CURRENCY_NOT_FOUND },
          }
        );
      }
      return currency;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.currencyId },
        "Error retrieving Currency"
      );
      throw new GraphQLError(
        "Failed to retrieve Currency. Please try again later.",
        {
          extensions: {
            code: error.extensions?.code || ERROR_CODES.GET_CURRENCY_ERROR,
            detailedMessage: error.message,
          },
        }
      );
    }
  },
};
