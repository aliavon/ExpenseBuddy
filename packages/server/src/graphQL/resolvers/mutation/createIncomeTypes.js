module.exports = async (
  _,
  { incomeTypes },
  { schemas: { IncomeType }, logger }
) => {
  const newIncomeTypes = await IncomeType.insertMany(incomeTypes);
  logger.info(
    { count: newIncomeTypes.length },
    "Successfully added income types"
  );
  return newIncomeTypes;
};
