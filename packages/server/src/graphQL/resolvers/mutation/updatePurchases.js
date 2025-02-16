module.exports = async (_, { updates }, { schemas: { Purchase }, logger }) => {
  const bulkOperations = updates.map((update) => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fields },
      },
    };
  });

  await Purchase.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => id);
  const updatedPurchases = await Purchase.find({ _id: { $in: updatedIds } });
  logger.info(
    { count: updatedPurchases.length },
    "Successfully updated purchases"
  );

  return updatedPurchases;
};
