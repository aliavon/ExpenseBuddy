const { requireAuth } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { updates }, context) => {
  const {
    schemas: { Currency },
    logger,
  } = context;

  // Require authentication (currencies are global system data)
  const auth = requireAuth(context);

  const bulkOperations = updates.map((update) => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: fields },
      },
    };
  });

  const bulkResult = await Currency.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => new mongoose.Types.ObjectId(id));
  const updatedCurrencies = await Currency.find({ _id: { $in: updatedIds } });

  logger.info(
    {
      count: updatedCurrencies.length,
      modifiedCount: bulkResult.modifiedCount,
      userId: auth.user.id,
    },
    "Successfully updated currencies"
  );

  return updatedCurrencies;
};
