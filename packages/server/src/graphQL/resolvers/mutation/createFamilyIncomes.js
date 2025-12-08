const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { familyIncomes }, context) => {
  const {
    schemas: { FamilyIncome },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  // Enrich family incomes with family context and convert IDs to ObjectId
  const enrichedFamilyIncomes = familyIncomes.map((income) => ({
    ...income,
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
    contributorId: new mongoose.Types.ObjectId(income.contributorId),
    typeId: new mongoose.Types.ObjectId(income.typeId),
    currencyId: new mongoose.Types.ObjectId(income.currencyId),
    date: new Date(income.date),
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
