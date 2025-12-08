const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");
const { withErrorHandling } = require("../error-handling");

// Helper function to generate all months in a date range
const generateMonthRange = (startDate, endDate) => {
  const months = [];
  const current = new Date(startDate);
  current.setDate(1); // Set to first day of month

  const end = new Date(endDate);
  end.setDate(1);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

const getIncomeTrends = async (_, { dateFrom, dateTo }, context) => {
  const {
    schemas: { FamilyIncome },
    logger,
  } = context;

  const auth = requireFamily(context);
  const familyId = new mongoose.Types.ObjectId(auth.user.familyId);

  logger.info("getIncomeTrends called", { familyId, dateFrom, dateTo });

  // Parse dates
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Aggregate by month
  const results = await FamilyIncome.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$date" },
        },
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Create a map of results for quick lookup
  const resultsMap = new Map();
  results.forEach((item) => {
    resultsMap.set(item._id, {
      amount: item.amount,
      count: item.count,
    });
  });

  // Generate all months in range and fill missing months with zeros
  const allMonths = generateMonthRange(startDate, endDate);
  const trends = allMonths.map((month) => {
    const data = resultsMap.get(month);
    return {
      period: month,
      amount: data?.amount || 0,
      count: data?.count || 0,
    };
  });

  logger.info("getIncomeTrends result", { count: trends.length });

  return trends;
};

module.exports = withErrorHandling(getIncomeTrends);
