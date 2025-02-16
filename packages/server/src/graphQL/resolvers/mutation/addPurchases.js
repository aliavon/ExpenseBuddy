module.exports = async (
  _,
  { purchases },
  { schemas: { Purchase }, logger }
) => {
  const newPurchases = await Purchase.insertMany(purchases);
  logger.info({ count: newPurchases.length }, "Successfully added purchases");
  return newPurchases;
};
