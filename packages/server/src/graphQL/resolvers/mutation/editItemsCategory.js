const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { names, newCategory },
  { schemas: { Item }, logger }
) => {
  try {
    await Item.updateMany(
      { name: { $in: names } },
      { $set: { category: newCategory } }
    );
    const updatedItems = await Item.find({ name: { $in: names } });
    logger.info(
      { count: updatedItems.length },
      "Successfully updated items category"
    );
    return updatedItems;
  } catch (error) {
    logger.error({ err: error }, "Error updating items category");
    throw new GraphQLError(
      "Failed to update items category. Please try again later.",
      {
        extensions: {
          code: ERROR_CODES.EDIT_ITEMS_CATEGORY_ERROR,
          detailedMessage: error.message,
        },
      }
    );
  }
};
