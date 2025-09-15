const { GraphQLError } = require("graphql");
const { FamilyJoinRequest } = require("../../../database/schemas");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Get current user's family join requests
 */
async function myJoinRequests(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  try {
    // Get all join requests for this user, ordered by most recent first
    const requests = await FamilyJoinRequest.find({
      userId: auth.user._id,
      isActive: true,
    })
      .populate("familyId", "name description isActive")
      .populate("ownerId", "firstName lastName email")
      .sort({ requestedAt: -1 }) // Most recent first
      .lean();

    return requests;
  } catch (error) {
    console.error("Error in myJoinRequests:", error);
    throw new GraphQLError("Failed to fetch join requests", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedMyJoinRequests = withErrorHandlingCurried({
  errorCode: ERROR_CODES.GET_FAMILY_REQUESTS_FAILED,
  errorMessage: "Failed to fetch family join requests",
})(myJoinRequests);

module.exports = wrappedMyJoinRequests;
module.exports.myJoinRequestsResolver = myJoinRequests;
