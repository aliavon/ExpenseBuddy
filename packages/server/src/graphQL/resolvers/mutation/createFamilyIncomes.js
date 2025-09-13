const { requireFamily } = require("../../../auth");

module.exports = async (_, { familyIncomes }, context) => {
  const {
    schemas: { FamilyIncome },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Enrich family incomes with family context
  const enrichedFamilyIncomes = familyIncomes.map((income) => ({
    ...income,
    familyId: auth.user.familyId,
  }));

  const newFamilyIncomes = await FamilyIncome.insertMany(enrichedFamilyIncomes);

  logger.info(
    {
      count: newFamilyIncomes.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully created family income records"
  );

  return newFamilyIncomes;
};
