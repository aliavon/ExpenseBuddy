module.exports = async (_, __, { schemas: { Item }, logger }) => {
  const categories = await Item.distinct("category");
  const filteredCategories = categories.filter(
    (category) => category && category.trim() !== ""
  );
  logger.info(
    { count: filteredCategories.length },
    "Successfully retrieved categories"
  );
  return filteredCategories;
};
