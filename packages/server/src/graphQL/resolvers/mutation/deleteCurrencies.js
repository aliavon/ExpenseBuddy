const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");
const { requireAuth } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { ids }, context) => {
  const {
    schemas: { Currency, FamilyIncome },
    logger,
  } = context;

  // Require authentication (currencies are global system data)
  const auth = requireAuth(context);

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  // Check if any of these currencies are in use by any family
  const usedCount = await FamilyIncome.countDocuments({
    currencyId: { $in: objectIds },
  });

  if (usedCount > 0) {
    throw new GraphQLError(
      "One or more currencies are in use and cannot be deleted.",
      { extensions: { code: ERROR_CODES.CURRENCY_IN_USE } }
    );
  }

  const deleteResult = await Currency.deleteMany({ _id: { $in: objectIds } });

  logger.info(
    {
      requestedCount: ids.length,
      deletedCount: deleteResult.deletedCount,
      userId: auth.user.id,
    },
    "Successfully deleted currencies"
  );

  return ids;
};
