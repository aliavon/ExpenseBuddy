const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../constants/errorCodes");

module.exports = {
  id: (parent) => parent.id || parent._id,

  date: (parent) => {
    // Always convert to ISO string
    if (parent.date instanceof Date) {
      return parent.date.toISOString();
    }
    // If it's a timestamp (number or string), convert to Date first
    if (
      typeof parent.date === "number" ||
      (typeof parent.date === "string" && !isNaN(parent.date))
    ) {
      return new Date(Number(parent.date)).toISOString();
    }
    // If it's already an ISO string, return as is
    return parent.date;
  },

  type: async (parent, _, { logger, loaders: { incomeTypeLoader } }) => {
    // Return null if typeId is not set
    if (!parent.typeId) {
      return null;
    }

    try {
      const incomeType = await incomeTypeLoader.load(parent.typeId.toString());
      if (!incomeType) {
        logger.error({ parentId: parent.typeId }, "IncomeType not found");
        return null; // Return null instead of throwing error
      }
      return incomeType;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.typeId },
        "Error retrieving IncomeType"
      );
      return null; // Return null on error
    }
  },

  contributor: async (parent, _, { logger, loaders: { userLoader } }) => {
    // Return null if contributorId is not set
    if (!parent.contributorId) {
      return null;
    }

    try {
      const user = await userLoader.load(parent.contributorId.toString());
      if (!user) {
        logger.error({ parentId: parent.contributorId }, "User not found");
        return null; // Return null instead of throwing error
      }
      return user;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.contributorId },
        "Error retrieving User"
      );
      return null; // Return null on error
    }
  },
  currency: async (parent, _, { logger, loaders: { currencyLoader } }) => {
    // Return null if currencyId is not set
    if (!parent.currencyId) {
      return null;
    }

    try {
      const currency = await currencyLoader.load(parent.currencyId.toString());
      if (!currency) {
        logger.error({ parentId: parent.currencyId }, "Currency not found");
        return null; // Return null instead of throwing error
      }
      return currency;
    } catch (error) {
      logger.error(
        { err: error, parentId: parent.currencyId },
        "Error retrieving Currency"
      );
      return null; // Return null on error
    }
  },
};
