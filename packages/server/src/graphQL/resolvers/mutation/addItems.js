module.exports = async (_, { items }, { schemas: { Item } }) => {
  const newItems = await Item.insertMany(items);
  return newItems;
};