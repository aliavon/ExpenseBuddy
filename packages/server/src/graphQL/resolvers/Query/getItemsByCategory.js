module.exports = async (_, { category }, { schemas: { Item } }) => {
  return await Item.find({ category });
};
