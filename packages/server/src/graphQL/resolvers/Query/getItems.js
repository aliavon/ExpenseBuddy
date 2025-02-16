module.exports = async (
  _,
  { names, category },
  { schemas: { Item }, logger }
) => {
  const filter = {};
  if (names && names.length > 0) {
    filter.name = { $in: names };
  }
  if (category && category.trim() !== "") {
    filter.category = category;
  }
  const items = await Item.find(filter);
  logger.info({ count: items.length }, "Successfully retrieved items");
  return items;
};
