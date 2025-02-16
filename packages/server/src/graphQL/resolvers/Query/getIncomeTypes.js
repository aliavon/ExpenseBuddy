module.exports = async (_, __, { schemas: { IncomeType }, logger }) => {
  const incomeTypes = await IncomeType.find({});
  logger.info(
    { count: incomeTypes.length },
    "Successfully retrieved income types"
  );
  return incomeTypes;
};
