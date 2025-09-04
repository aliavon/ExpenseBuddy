const { requireAuth } = require("../../../auth");

module.exports = async (_, { from, to }, context) => {
  const {
    schemas: { Purchase },
    logger,
  } = context;

  // Require authentication and get family context
  const auth = requireAuth(context);

  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Filter purchases by family and date range
  const filter = {
    date: { $gte: fromDate, $lte: toDate },
  };

  // If user has familyId, filter by family. Otherwise return empty array
  if (auth.user.familyId) {
    filter.familyId = auth.user.familyId;
  } else {
    // User not in family yet - return empty array
    logger.info(
      { userId: auth.user.id },
      "User not in family - returning empty purchases"
    );
    return [];
  }

  const purchases = await Purchase.find(filter);

  logger.info(
    {
      count: purchases.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved purchases for family"
  );

  return purchases;
};
