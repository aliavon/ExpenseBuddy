const { GraphQLError } = require("graphql");
const { User } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Get current authenticated user
 */
async function me(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  // Get full user info with family populated
  const user = await User.findOne({
    _id: auth.user.id,
    isActive: true,
  }).populate("familyId");

  if (!user) {
    throw new GraphQLError("User not found or deactivated", {
      extensions: { code: ERROR_CODES.USER_NOT_FOUND },
    });
  }

  return user;
}

// Export wrapped function as default
const wrappedMe = withErrorHandlingCurried({
  errorCode: ERROR_CODES.GET_USER_FAILED,
  errorMessage: "Failed to get current user",
})(me);

module.exports = wrappedMe;
// Export unwrapped function for testing
module.exports.meResolver = me;
