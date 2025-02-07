module.exports = async (_, __, { schemas: { Item } }) => {
  const categories = await Item.distinct('category');
  return categories.filter((category) => category);
}