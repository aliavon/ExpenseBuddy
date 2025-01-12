module.exports = async (_, { ids }, {schemas: {Purchase}}) => {
  const deleted = await Purchase.deleteMany({ _id: { $in: ids } });
  return ids;
}