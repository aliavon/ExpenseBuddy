module.exports = async (
  _,
  { currencies },
  { schemas: { Currency }, logger }
) => {
  const newCurrencies = await Currency.insertMany(currencies);
  logger.info({ count: newCurrencies.length }, "Successfully added currencies");
  return newCurrencies;
};
