module.exports = async (
  _,
  { familyIncomes },
  { schemas: { FamilyIncome }, logger }
) => {
  const newFamilyIncomes = await FamilyIncome.insertMany(familyIncomes);
  logger.info(
    { count: newFamilyIncomes.length },
    "Successfully created FamilyIncome records"
  );
  return newFamilyIncomes;
};
