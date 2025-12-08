const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");
const { withErrorHandling } = require("../error-handling");

const getIncomeStatistics = async (_, { dateFrom, dateTo }, context) => {
  const {
    schemas: { FamilyIncome, User, IncomeType },
    logger,
  } = context;

  const auth = requireFamily(context);
  const familyId = new mongoose.Types.ObjectId(auth.user.familyId);

  logger.info("getIncomeStatistics called", { familyId, dateFrom, dateTo });

  // Parse dates
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Total statistics
  const stats = await FamilyIncome.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$amount" },
        averageIncome: { $avg: "$amount" },
        incomeCount: { $sum: 1 },
      },
    },
  ]);

  // Top contributor (highest total income)
  const topContributor = await FamilyIncome.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$contributorId",
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  // Top income type (highest total income)
  const topType = await FamilyIncome.aggregate([
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
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  // Build result
  const result = {
    totalIncome: stats[0]?.totalIncome || 0,
    averageIncome: stats[0]?.averageIncome || 0,
    incomeCount: stats[0]?.incomeCount || 0,
    topContributor: topContributor[0]
      ? await User.findById(topContributor[0]._id).lean()
      : null,
    topIncomeType: topType[0]
      ? await IncomeType.findById(topType[0]._id).lean()
      : null,
  };

  logger.info("getIncomeStatistics result", result);

  return result;
};

module.exports = withErrorHandling(getIncomeStatistics);
