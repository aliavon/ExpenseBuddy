const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { purchases }, context) => {
  const {
    schemas: { Purchase },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Enrich purchases with family and user context
  const enrichedPurchases = purchases.map((purchase) => ({
    ...purchase,
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
    createdByUserId: new mongoose.Types.ObjectId(auth.user.id),
  }));

  const newPurchases = await Purchase.insertMany(enrichedPurchases);

  logger.info(
    {
      count: newPurchases.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully added purchases for family"
  );

  return newPurchases;
};
