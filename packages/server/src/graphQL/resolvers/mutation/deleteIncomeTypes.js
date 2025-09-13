const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");
const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { ids }, context) => {
  const {
    schemas: { IncomeType, FamilyIncome },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  // Check if any of these income types are in use within the user's family
  const count = await FamilyIncome.countDocuments({
    typeId: { $in: objectIds },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  if (count > 0) {
    throw new GraphQLError(
      "One or more IncomeTypes are in use by your family and cannot be deleted.",
      {
        extensions: { code: ERROR_CODES.INCOME_TYPE_IN_USE },
      }
    );
  }

  // Only delete income types from user's family
  const deleteResult = await IncomeType.deleteMany({
    _id: { $in: objectIds },
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  logger.info(
    {
      requestedCount: ids.length,
      deletedCount: deleteResult.deletedCount,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully deleted family income types"
  );

  // Log warning if some records were not found/deleted
  if (deleteResult.deletedCount !== ids.length) {
    logger.warn(
      {
        requestedCount: ids.length,
        deletedCount: deleteResult.deletedCount,
        userId: auth.user.id,
      },
      "Some income types were not found or not owned by user's family"
    );
  }

  return ids;
};
