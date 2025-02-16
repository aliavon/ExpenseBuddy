module.exports = async (_, __, { schemas: { Currency }, logger }) => {
  const currencies = await Currency.find({});
  logger.info(
    { count: currencies.length },
    "Successfully retrieved currencies"
  );

  return currencies;
};
