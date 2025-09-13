const { GraphQLError } = require("graphql");
const { Family, User } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Leave current family (requires authentication, owner cannot leave)
 */
async function leaveFamilyResolver(parent, args, context) {
  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to leave a family", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is in a family
    if (!user.familyId) {
      throw new GraphQLError("You are not a member of any family", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Find the family
    const family = await Family.findById(user.familyId);

    if (!family) {
      throw new GraphQLError("Family not found", {
        extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
      });
    }

    if (!family.isActive) {
      throw new GraphQLError("Family is not active", {
        extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
      });
    }

    // Check if user is the family owner
    if (family.ownerId.toString() === user._id.toString()) {
      throw new GraphQLError(
        "Family owner cannot leave the family. Transfer ownership or delete the family first.",
        {
          extensions: { code: ERROR_CODES.VALIDATION_ERROR },
        }
      );
    }

    // Remove user from family
    await User.findByIdAndUpdate(user._id, { familyId: null }, { new: true });

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to leave family", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default (no validation needed for this resolver)
const wrappedLeaveFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to leave family",
})(leaveFamilyResolver);

module.exports = wrappedLeaveFamily;
// Export unwrapped function for testing
module.exports.leaveFamilyResolver = leaveFamilyResolver;
