const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { updates }, context) => {
  const {
    schemas: { FamilyIncome },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Build bulk operations with family security
  const bulkOperations = updates.map(({ id, ...fields }) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(id),
        familyId: new mongoose.Types.ObjectId(auth.user.familyId), // Only update income from user's family
      },
      update: { $set: fields },
    },
  }));

  const bulkResult = await FamilyIncome.bulkWrite(bulkOperations);

  const updatedIds = updates.map(({ id }) => new mongoose.Types.ObjectId(id));
  const updatedFamilyIncomes = await FamilyIncome.find({
    _id: { $in: updatedIds },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId), // Only return income from user's family
  });

  logger.info(
    {
      count: updatedFamilyIncomes.length,
      modifiedCount: bulkResult.modifiedCount,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully updated family income records"
  );

  return updatedFamilyIncomes;
};
