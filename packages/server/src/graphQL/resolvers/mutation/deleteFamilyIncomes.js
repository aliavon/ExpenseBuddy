module.exports = async (_, { ids }, { schemas: { FamilyIncome }, logger }) => {
  await FamilyIncome.deleteMany({ _id: { $in: ids } });
  logger.info(
    { count: ids.length },
    "Successfully deleted FamilyIncome records"
  );
  return ids;
};
