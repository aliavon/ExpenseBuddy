const { GraphQLError } = require("graphql");
const { FamilyJoinRequest, Family } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Get incoming family join requests for families owned by the current user
 */
async function incomingJoinRequests(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  try {
    // Get all families owned by this user
    const ownedFamilies = await Family.find({
      ownerId: auth.user._id,
      isActive: true,
    })
      .select("_id")
      .lean();

    const familyIds = ownedFamilies.map((family) => family._id);

    if (familyIds.length === 0) {
      // User doesn't own any families, return empty array
      return [];
    }

    // Get all pending join requests for user's families
    const requests = await FamilyJoinRequest.find({
      familyId: { $in: familyIds },
      status: "PENDING",
      isActive: true,
    })
      .populate("userId", "firstName lastName email")
      .populate("familyId", "name description")
      .sort({ requestedAt: -1 }) // Most recent first
      .lean();

    return requests;
  } catch (error) {
    console.error("Error in incomingJoinRequests:", error);
    throw new GraphQLError("Failed to fetch incoming join requests", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedIncomingJoinRequests = withErrorHandlingCurried({
  errorCode: ERROR_CODES.GET_FAMILY_REQUESTS_FAILED,
  errorMessage: "Failed to fetch incoming family join requests",
})(incomingJoinRequests);

module.exports = wrappedIncomingJoinRequests;
module.exports.incomingJoinRequestsResolver = incomingJoinRequests;
