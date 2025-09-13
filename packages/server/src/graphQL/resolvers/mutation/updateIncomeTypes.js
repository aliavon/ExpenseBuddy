const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { updates }, context) => {
  const {
    schemas: { IncomeType },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Build bulk operations with family security
  const bulkOperations = updates.map((update) => {
    const { id, ...fields } = update;
    return {
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(id),
          familyId: new mongoose.Types.ObjectId(auth.user.familyId), // Only update income types from user's family
        },
        update: { $set: fields },
      },
    };
  });

  const bulkResult = await IncomeType.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => new mongoose.Types.ObjectId(id));
  const updatedIncomeTypes = await IncomeType.find({
    _id: { $in: updatedIds },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId), // Only return income types from user's family
  });

  logger.info(
    {
      count: updatedIncomeTypes.length,
      modifiedCount: bulkResult.modifiedCount,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully updated family income types"
  );

  return updatedIncomeTypes;
};
