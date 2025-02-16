module.exports = async (_, { updates }, { schemas: { Currency }, logger }) => {
  const bulkOperations = updates.map((update) => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fields },
      },
    };
  });

  await Currency.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => id);
  const updatedCurrencies = await Currency.find({ _id: { $in: updatedIds } });
  logger.info(
    { count: updatedCurrencies.length },
    "Successfully updated currencies"
  );
  return updatedCurrencies;
};
