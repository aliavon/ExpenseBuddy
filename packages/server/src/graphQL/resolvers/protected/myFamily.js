const { GraphQLError } = require("graphql");
const { Family } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Get current user's family with all members
 */
async function myFamily(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  // Get family with populated owner and currency
  const family = await Family.findOne({
    _id: auth.user.familyId,
    isActive: true,
  })
    .populate("ownerId")
    .populate("currency");

  if (!family) {
    throw new GraphQLError("Family not found", {
      extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
    });
  }

  return family;
}

// Export wrapped function as default
const wrappedMyFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.GET_FAMILY_FAILED,
  errorMessage: "Failed to get family information",
})(myFamily);

module.exports = wrappedMyFamily;
// Export unwrapped function for testing
module.exports.myFamilyResolver = myFamily;
