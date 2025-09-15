const { GraphQLError } = require("graphql");
const { User, Family } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Get family members for the authenticated user's family
 * Only accessible by family owners
 */
async function familyMembers(parent, args, context) {
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
        "Unauthorized: Only family owners can view members",
        {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        }
      );
    }

    // Get all family members
    const members = await User.find({
      familyId: auth.user.familyId,
      isActive: true,
    })
      .select("firstName lastName email roleInFamily createdAt")
      .sort({ roleInFamily: 1, firstName: 1 }) // Owner first, then alphabetical
      .lean();

    return members;
  } catch (error) {
    console.error("Error in familyMembers:", error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError("Failed to fetch family members", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedFamilyMembers = withErrorHandlingCurried({
  errorCode: ERROR_CODES.GET_FAMILY_MEMBERS_FAILED,
  errorMessage: "Failed to fetch family members",
})(familyMembers);

module.exports = wrappedFamilyMembers;
module.exports.familyMembersResolver = familyMembers;
