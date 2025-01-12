module.exports = async (_, { from, to }, {schemas: {Purchase}}) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return await Purchase.find({
    date: { $gte: fromDate, $lte: toDate },
  });
}