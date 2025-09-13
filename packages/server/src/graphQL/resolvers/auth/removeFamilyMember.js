const { GraphQLError } = require("graphql");
const { Family, User } = require("../../../database/schemas");
const {
  withValidationCurried,
  removeFamilyMemberSchema,
} = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Remove family member (requires OWNER or ADMIN role)
 */
async function removeFamilyMember(parent, args, context) {
  const { userId } = args;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to remove family members", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is in a family
    if (!user.familyId) {
      throw new GraphQLError(
        "You must be a member of a family to remove others",
        {
          extensions: { code: ERROR_CODES.VALIDATION_ERROR },
        }
      );
    }

    // Prevent self-removal
    if (userId === user._id.toString()) {
      throw new GraphQLError(
        "You cannot remove yourself from the family. Use leave family instead.",
        {
          extensions: { code: ERROR_CODES.VALIDATION_ERROR },
        }
      );
    }

    // Find user's family
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

    // Check if user has permission to remove members (OWNER or ADMIN only)
    const isOwner = family.ownerId.toString() === user._id.toString();
    const isAdmin = user.roleInFamily === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new GraphQLError("Only family owner or admin can remove members", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    // Find target user to remove
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      throw new GraphQLError("User not found", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    if (!targetUser.isActive) {
      throw new GraphQLError("User account is deactivated", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    // Check if target user is in the same family
    if (
      !targetUser.familyId ||
      targetUser.familyId.toString() !== family._id.toString()
    ) {
      throw new GraphQLError("User is not a member of your family", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Check if trying to remove family owner
    if (family.ownerId.toString() === targetUser._id.toString()) {
      throw new GraphQLError("Cannot remove family owner", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Check admin permissions: admin cannot remove another admin, only owner can
    if (!isOwner && targetUser.roleInFamily === "ADMIN") {
      throw new GraphQLError(
        "Admin cannot remove another admin. Only owner can remove admins.",
        {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        }
      );
    }

    // Remove user from family
    await User.findByIdAndUpdate(userId, { familyId: null }, { new: true });

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to remove family member", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedRemoveFamilyMember = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to remove family member",
})(withValidationCurried(removeFamilyMemberSchema)(removeFamilyMember));

module.exports = wrappedRemoveFamilyMember;
// Export unwrapped function for testing
module.exports.removeFamilyMemberResolver = removeFamilyMember;
