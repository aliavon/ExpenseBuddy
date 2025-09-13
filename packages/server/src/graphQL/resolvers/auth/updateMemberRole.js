const { GraphQLError } = require("graphql");
const { Family, User } = require("../../../database/schemas");
const { withValidationCurried, updateMemberRoleSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Update family member role (requires OWNER role only)
 */
async function updateMemberRole(parent, args, context) {
  const { input } = args;
  const { userId, role } = input;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to update member roles", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is in a family
    if (!user.familyId) {
      throw new GraphQLError("You must be a member of a family to update member roles", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Prevent OWNER role assignment
    if (role === "OWNER") {
      throw new GraphQLError("Cannot assign OWNER role to members", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
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

    // Check if user is owner (only owner can update roles)
    const isOwner = family.ownerId.toString() === user._id.toString();

    if (!isOwner) {
      throw new GraphQLError("Only family owner can update member roles", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    // Find target user to update
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
    if (!targetUser.familyId || targetUser.familyId.toString() !== family._id.toString()) {
      throw new GraphQLError("User is not a member of your family", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Check if trying to update owner's role
    if (family.ownerId.toString() === targetUser._id.toString()) {
      throw new GraphQLError("Cannot change family owner role", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Update user's role in family
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { roleInFamily: role },
      { new: true }
    );

    return updatedUser;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to update member role", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedUpdateMemberRole = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to update member role",
})(withValidationCurried(updateMemberRoleSchema)(updateMemberRole));

module.exports = wrappedUpdateMemberRole;
// Export unwrapped function for testing
module.exports.updateMemberRoleResolver = updateMemberRole;
