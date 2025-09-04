const { SORT_ORDER } = require("../../../constants/sortOrder");
const { requireFamily } = require("../../../auth");

module.exports = async (
  _,
  { filters = {}, pagination, sort = {} },
  context
) => {
  const {
    schemas: { FamilyIncome },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const { dateFrom, dateTo, contributorId, typeId } = filters;
  const { page, limit } = pagination;
  const { sortBy, sortOrder } = sort;

  const queryFilter = {
    // Always filter by family
    familyId: auth.user.familyId,
  };

  if (dateFrom || dateTo) {
    queryFilter.date = {};
    if (dateFrom) {
      queryFilter.date.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      queryFilter.date.$lte = new Date(dateTo);
    }
  }
  if (contributorId) {
    queryFilter.contributorId = contributorId;
  }
  if (typeId) {
    queryFilter.typeId = typeId;
  }

  const skip = (page - 1) * limit;

  let sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] =
      sortOrder && sortOrder.toLowerCase() === SORT_ORDER.ASC ? 1 : -1;
  } else {
    sortOptions = { date: -1 };
  }

  const totalCount = await FamilyIncome.countDocuments(queryFilter);
  const totalPages = Math.ceil(totalCount / limit);
  const nextPage = page < totalPages ? page + 1 : null;

  const incomes = await FamilyIncome.find(queryFilter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  logger.info(
    {
      count: incomes.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved FamilyIncome records for family"
  );

  return {
    items: incomes,
    pagination: {
      currentPage: page,
      nextPage,
      totalPages,
      totalCount,
    },
  };
};
