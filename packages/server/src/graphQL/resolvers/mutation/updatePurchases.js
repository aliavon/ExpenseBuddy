module.exports = async (_, { updates }, {schemas: {Purchase}}) => {
  const updatedPurchases = [];
  for (const update of updates) {
    const { id, ...fields } = update;
    const updatedPurchase = await Purchase.findByIdAndUpdate(id, fields, { new: true });
    updatedPurchases.push(updatedPurchase);
  }
  return updatedPurchases;
}