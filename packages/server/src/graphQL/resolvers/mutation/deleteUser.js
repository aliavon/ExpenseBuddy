const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (
  _,
  { id },
  { schemas: { User, FamilyIncome }, logger }
) => {
  // Find the user to verify existence and check if they are verified.
  const user = await User.findById(id);
  if (!user) {
    throw new GraphQLError(`User not found for id ${id}`, {
      extensions: { code: ERROR_CODES.GET_USER_ERROR },
    });
  }
  // Only allow deletion if the user is not verified.
  if (user.isVerified) {
    throw new GraphQLError("Cannot delete verified user.", {
      extensions: { code: ERROR_CODES.DELETE_USER_FORBIDDEN },
    });
  }
  // Optionally check if the user is referenced in FamilyIncome records.
  const usageCount = await FamilyIncome.countDocuments({ contributorId: id });
  if (usageCount > 0) {
    throw new GraphQLError(
      "User is used in family income records and cannot be deleted.",
      {
        extensions: { code: ERROR_CODES.DELETE_USER_ERROR },
      }
    );
  }
  await User.findByIdAndDelete(id);
  logger.info({ id }, "Successfully deleted user");
  return id;
};
