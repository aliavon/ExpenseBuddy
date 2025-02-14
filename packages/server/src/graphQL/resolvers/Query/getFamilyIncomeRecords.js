const { GraphQLError } = require("graphql");
const { SORT_ORDER } = require("../../../constants/sortOrder");

module.exports = async (
  _,
  { filters = {}, pagination, sort = {} },
  { schemas: { FamilyIncome }, logger }
) => {
  try {
    const { dateFrom, dateTo, contributorId, typeId } = filters;
    const { page, limit } = pagination;
    const { sortBy, sortOrder } = sort;

    const queryFilter = {};
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
      { count: incomes.length },
      "Successfully retrieved FamilyIncome records"
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
  } catch (error) {
    logger.error({ err: error }, "Error retrieving FamilyIncome records");
    throw new GraphQLError(
      "Failed to retrieve FamilyIncome records. Please try again later.",
      {
        extensions: {
          code: "GET_FAMILY_INCOME_ERROR",
          detailedMessage: error.message,
        },
      }
    );
  }
};
