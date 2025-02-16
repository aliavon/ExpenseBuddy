module.exports = async (
  _,
  { updates },
  { schemas: { IncomeType }, logger }
) => {
  const bulkOperations = updates.map((update) => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fields },
      },
    };
  });

  await IncomeType.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => id);
  const updatedIncomeTypes = await IncomeType.find({
    _id: { $in: updatedIds },
  });
  logger.info(
    { count: updatedIncomeTypes.length },
    "Successfully updated income types"
  );
  return updatedIncomeTypes;
};
