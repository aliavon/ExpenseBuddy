const { requireFamily } = require("../../../auth");

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
    familyId: auth.user.familyId,
    createdByUserId: auth.user.id,
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
