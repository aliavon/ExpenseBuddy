module.exports = async (_, { names }, { schemas: { Item }, logger }) => {
  const items = await Item.find({ name: { $in: names } });
  const itemsByName = {};
  items.forEach((item) => {
    itemsByName[item.name] = item;
  });
  const result = names.map((name) => ({
    name,
    category: itemsByName[name] ? itemsByName[name].category : null,
  }));
  logger.info(
    { count: result.length },
    "Successfully retrieved purchases category suggestion"
  );
  return result;
};
