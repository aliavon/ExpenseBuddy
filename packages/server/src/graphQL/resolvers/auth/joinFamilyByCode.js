const { GraphQLError } = require("graphql");
const { Family, User } = require("../../../database/schemas");
const {
  withValidationCurried,
  joinFamilyByCodeSchema,
} = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Join a family using invite code (requires authentication)
 */
async function joinFamilyByCodeResolver(parent, args, context) {
  const { inviteCode } = args;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to join a family", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is already in a family
    if (user.familyId) {
      throw new GraphQLError("You are already a member of a family", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Normalize invite code (trim whitespace and convert to uppercase)
    const normalizedCode = inviteCode.trim().toUpperCase();

    // Find family by invite code
    const family = await Family.findOne({
      inviteCode: normalizedCode,
      isActive: true,
    });

    if (!family) {
      throw new GraphQLError("Invalid invite code", {
        extensions: { code: ERROR_CODES.INVALID_INVITE_CODE },
      });
    }

    // Prevent users from joining their own family via invite code
    if (family.ownerId.toString() === user._id.toString()) {
      throw new GraphQLError(
        "You cannot join your own family using invite code",
        {
          extensions: { code: ERROR_CODES.VALIDATION_ERROR },
        }
      );
    }

    // Update user to be a member of the family
    await User.findByIdAndUpdate(
      user._id,
      { familyId: family._id },
      { new: true }
    );

    return family;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to join family", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedJoinFamilyByCode = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to join family",
})(withValidationCurried(joinFamilyByCodeSchema)(joinFamilyByCodeResolver));

module.exports = wrappedJoinFamilyByCode;
// Export unwrapped function for testing
module.exports.joinFamilyByCodeResolver = joinFamilyByCodeResolver;
