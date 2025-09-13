const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { ids }, context) => {
  const {
    schemas: { Purchase },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Only delete purchases from user's family
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const deleteResult = await Purchase.deleteMany({
    _id: { $in: objectIds },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  logger.info(
    {
      requestedCount: ids.length,
      deletedCount: deleteResult.deletedCount,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully deleted family purchases"
  );

  // Return only the IDs that were actually deleted from the user's family
  if (deleteResult.deletedCount !== ids.length) {
    logger.warn(
      {
        requestedCount: ids.length,
        deletedCount: deleteResult.deletedCount,
        userId: auth.user.id,
      },
      "Some purchases were not found or not owned by user's family"
    );
  }

  return ids;
};
