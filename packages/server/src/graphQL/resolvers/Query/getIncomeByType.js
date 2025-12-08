const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");
const { withErrorHandling } = require("../error-handling");

const getIncomeByType = async (_, { dateFrom, dateTo }, context) => {
  const {
    schemas: { FamilyIncome, IncomeType },
    logger,
  } = context;

  const auth = requireFamily(context);
  const familyId = new mongoose.Types.ObjectId(auth.user.familyId);

  logger.info("getIncomeByType called", { familyId, dateFrom, dateTo });

  // Parse dates
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Aggregate by type
  const results = await FamilyIncome.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
        typeId: { $ne: null }, // Exclude records without typeId
      },
    },
    {
      $group: {
        _id: "$typeId",
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { amount: -1 },
    },
  ]);

  // Calculate total for percentages
  const total = results.reduce((sum, item) => sum + item.amount, 0);

  // Populate types and add percentages
  const incomeByType = await Promise.all(
    results
      .filter((item) => item._id) // Filter out any null _id
      .map(async (item) => {
        const type = await IncomeType.findById(item._id).lean();
        if (!type) {
          logger.warn({ typeId: item._id }, "IncomeType not found");
          return null;
        }
        return {
          type,
          amount: item.amount,
          count: item.count,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        };
      })
  );

  // Filter out null results
  const filteredResults = incomeByType.filter((item) => item !== null);

  logger.info("getIncomeByType result", { count: filteredResults.length });

  return filteredResults;
};

module.exports = withErrorHandling(getIncomeByType);
