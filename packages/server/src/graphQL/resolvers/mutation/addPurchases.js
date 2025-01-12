module.exports = async (_, { purchases }, {schemas: {Purchase}}) => {
  const newPurchases = await Purchase.insertMany(purchases);
  return newPurchases;
}