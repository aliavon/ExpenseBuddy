const { requireAuth } = require("../../../auth");

module.exports = async (_, { currencies }, context) => {
  const {
    schemas: { Currency },
    logger,
  } = context;

  // Require authentication (currencies are global system data)
  const auth = requireAuth(context);

  const newCurrencies = await Currency.insertMany(currencies);

  logger.info(
    {
      count: newCurrencies.length,
      userId: auth.user.id,
    },
    "Successfully added currencies"
  );

  return newCurrencies;
};
