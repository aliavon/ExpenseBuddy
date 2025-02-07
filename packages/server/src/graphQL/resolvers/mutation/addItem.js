module.exports = async (_, { itemInput }, { schemas: { Item } }) => {
  const newItem = await Item.create(itemInput);
  return newItem;
};
