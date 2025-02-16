module.exports = async (_, { ids }, { schemas: { Purchase }, logger }) => {
  await Purchase.deleteMany({ _id: { $in: ids } });
  logger.info({ count: ids.length }, "Successfully deleted purchases");
  return ids;
};
