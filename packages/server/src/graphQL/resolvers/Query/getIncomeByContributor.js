const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");
const { withErrorHandling } = require("../error-handling");

const getIncomeByContributor = async (_, { dateFrom, dateTo }, context) => {
  const {
    schemas: { FamilyIncome, User },
    logger,
  } = context;

  const auth = requireFamily(context);
  const familyId = new mongoose.Types.ObjectId(auth.user.familyId);

  logger.info("getIncomeByContributor called", { familyId, dateFrom, dateTo });

  // Parse dates
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Aggregate by contributor
  const results = await FamilyIncome.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
        contributorId: { $ne: null }, // Exclude records without contributorId
      },
    },
    {
      $group: {
        _id: "$contributorId",
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

  // Populate contributors and add percentages
  const incomeByContributor = await Promise.all(
    results
      .filter((item) => item._id) // Filter out any null _id
      .map(async (item) => {
        const contributor = await User.findById(item._id).lean();
        if (!contributor) {
          logger.warn({ contributorId: item._id }, "User not found");
          return null;
        }
        return {
          contributor,
          amount: item.amount,
          count: item.count,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        };
      })
  );

  // Filter out null results
  const filteredResults = incomeByContributor.filter((item) => item !== null);

  logger.info("getIncomeByContributor result", {
    count: filteredResults.length,
  });

  return filteredResults;
};

module.exports = withErrorHandling(getIncomeByContributor);
