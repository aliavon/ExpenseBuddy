module.exports = async (
  _,
  { updates },
  { schemas: { FamilyIncome }, logger }
) => {
  const bulkOperations = updates.map(({ id, ...fields }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: fields },
    },
  }));

  await FamilyIncome.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => id);
  const updatedFamilyIncomes = await FamilyIncome.find({
    _id: { $in: updatedIds },
  });

  logger.info(
    { count: updatedFamilyIncomes.length },
    "Successfully updated FamilyIncome records"
  );
  return updatedFamilyIncomes;
};
