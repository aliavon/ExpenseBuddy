const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { names, newCategory }, context) => {
  const {
    schemas: { Item },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Only update items from user's family
  const updateResult = await Item.updateMany(
    {
      name: { $in: names },
      familyId: new mongoose.Types.ObjectId(auth.user.familyId),
    },
    { $set: { category: newCategory } }
  );

  // Only return items from user's family
  const updatedItems = await Item.find({
    name: { $in: names },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  logger.info(
    {
      count: updatedItems.length,
      modifiedCount: updateResult.modifiedCount,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully updated family items category"
  );

  return updatedItems;
};
