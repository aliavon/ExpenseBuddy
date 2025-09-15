const { GraphQLError } = require("graphql");
const { User, Family } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Remove a member from family (owner only)
 * Cannot remove the owner themselves
 */
async function removeFamilyMember(parent, args, context) {
  const { userId } = args;
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  // Check if user has a family
  if (!auth.user.familyId) {
    throw new GraphQLError("User is not part of any family", {
      extensions: { code: ERROR_CODES.USER_NOT_IN_FAMILY },
    });
  }

  try {
    // Check if user is owner of the family
    const family = await Family.findById(auth.user.familyId)
      .select("ownerId")
      .lean();

    if (!family || family.ownerId.toString() !== auth.user._id.toString()) {
      throw new GraphQLError(
        "Unauthorized: Only family owners can remove members",
        {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        }
      );
    }

    // Find the user to be removed
    const userToRemove = await User.findById(userId)
      .select("familyId roleInFamily firstName lastName")
      .lean();

    if (!userToRemove) {
      throw new GraphQLError("User not found", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    // Check if user is in the same family
    if (userToRemove.familyId.toString() !== auth.user.familyId.toString()) {
      throw new GraphQLError("User is not a member of your family", {
        extensions: { code: ERROR_CODES.USER_NOT_IN_FAMILY },
      });
    }

    // Cannot remove the owner
    if (userToRemove.roleInFamily === "OWNER") {
      throw new GraphQLError("Cannot remove family owner", {
        extensions: { code: ERROR_CODES.CANNOT_REMOVE_OWNER },
      });
    }

    // Remove user from family
    await User.findByIdAndUpdate(userId, {
      $unset: {
        familyId: 1,
        roleInFamily: 1,
      },
    });

    console.log(
      `Family member removed: ${userToRemove.firstName} ${userToRemove.lastName} (${userId})`
    );

    return true;
  } catch (error) {
    console.error("Error in removeFamilyMember:", error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError("Failed to remove family member", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedRemoveFamilyMember = withErrorHandlingCurried({
  errorCode: ERROR_CODES.REMOVE_FAMILY_MEMBER_FAILED,
  errorMessage: "Failed to remove family member",
})(removeFamilyMember);

module.exports = wrappedRemoveFamilyMember;
module.exports.removeFamilyMemberResolver = removeFamilyMember;
