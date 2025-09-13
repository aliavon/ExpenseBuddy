const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");
const { requireSelfOrAdmin } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { id }, context) => {
  const {
    schemas: { User, FamilyIncome },
    logger,
  } = context;

  // Require authentication and check user can delete this specific user
  const auth = requireSelfOrAdmin(context, id);

  const objectId = new mongoose.Types.ObjectId(id);

  // Find the user to verify existence and family membership
  const user = await User.findOne({
    _id: objectId,
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  if (!user) {
    throw new GraphQLError(`User not found for id ${id} in your family`, {
      extensions: { code: ERROR_CODES.GET_USER_ERROR },
    });
  }

  // Only allow deletion if the user is not email verified (use isEmailVerified)
  if (user.isEmailVerified) {
    throw new GraphQLError("Cannot delete user with verified email.", {
      extensions: { code: ERROR_CODES.DELETE_USER_FORBIDDEN },
    });
  }

  // Check if the user is referenced in FamilyIncome records within the same family
  const usageCount = await FamilyIncome.countDocuments({
    contributorId: objectId,
    familyId: new mongoose.Types.ObjectId(auth.user.familyId),
  });

  if (usageCount > 0) {
    throw new GraphQLError(
      "User is used in family income records and cannot be deleted.",
      {
        extensions: { code: ERROR_CODES.DELETE_USER_ERROR },
      }
    );
  }

  await User.findByIdAndDelete(objectId);

  logger.info(
    {
      id,
      deletedBy: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully deleted family user"
  );

  return id;
};
