module.exports = async (_, { from, to }, { schemas: { Purchase }, logger }) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const purchases = await Purchase.find({
    date: { $gte: fromDate, $lte: toDate },
  });
  logger.info({ count: purchases.length }, "Successfully retrieved purchases");
  return purchases;
};
