module.exports = async (_, __, {schemas: {Purchase}}) => {
  const categories = await Purchase.distinct('category');
  return categories.filter((category) => category);
}