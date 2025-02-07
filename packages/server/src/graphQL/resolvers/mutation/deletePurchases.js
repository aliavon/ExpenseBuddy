module.exports = async (_, { ids }, {schemas: {Purchase}}) => {
  await Purchase.deleteMany({ _id: { $in: ids } });
  return ids;
}