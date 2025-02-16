module.exports = async (_, { items }, { schemas: { Item }, logger }) => {
  const newItems = await Item.insertMany(items);
  logger.info({ count: newItems.length }, "Successfully added items");
  return newItems;
};
