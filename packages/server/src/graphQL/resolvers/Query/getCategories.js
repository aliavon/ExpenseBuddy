const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, __, { schemas: { Item }, logger }) => {
  try {
    const categories = await Item.distinct("category");
    const filteredCategories = categories.filter(
      (category) => category && category.trim() !== ""
    );
    logger.info(
      { count: filteredCategories.length },
      "Successfully retrieved categories"
    );
    return filteredCategories;
  } catch (error) {
    logger.error({ err: error }, "Error retrieving categories");
    throw new GraphQLError(
      "Failed to retrieve categories. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.GET_CATEGORIES_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
