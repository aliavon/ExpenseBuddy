const { requireFamily } = require("../../../auth");

module.exports = async (_, { incomeTypes }, context) => {
  const {
    schemas: { IncomeType },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Enrich income types with family context
  const enrichedIncomeTypes = incomeTypes.map((incomeType) => ({
    ...incomeType,
    familyId: auth.user.familyId,
  }));

  const newIncomeTypes = await IncomeType.insertMany(enrichedIncomeTypes);

  logger.info(
    {
      count: newIncomeTypes.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully added family income types"
  );

  return newIncomeTypes;
};
