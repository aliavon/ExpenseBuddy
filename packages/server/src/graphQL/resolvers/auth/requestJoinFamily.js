const { GraphQLError } = require("graphql");
const {
  Family,
  User,
  FamilyJoinRequest,
} = require("../../../database/schemas");
const { sendFamilyJoinRequestEmail } = require("../../../auth/emailService");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Request to join a family - sends email to family owner
 */
async function requestJoinFamily(parent, args, context) {
  const { familyId } = args;
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  try {
    // Check if user already has a family
    if (auth.user.familyId) {
      throw new GraphQLError("You are already a member of a family", {
        extensions: { code: ERROR_CODES.USER_ALREADY_IN_FAMILY },
      });
    }

    // Find the target family with owner details
    const family = await Family.findById(familyId)
      .populate("ownerId", "firstName lastName email")
      .lean();

    if (!family || !family.isActive) {
      throw new GraphQLError("Family not found or inactive", {
        extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
      });
    }

    // Get current user details
    const requestingUser = await User.findById(auth.user._id)
      .select("firstName lastName email")
      .lean();

    if (!requestingUser) {
      throw new GraphQLError("User not found", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    // Send email to family owner
    try {
      await sendFamilyJoinRequestEmail(
        family.ownerId.email,
        family.name,
        requestingUser,
        family.ownerId.firstName
      );
    } catch (emailError) {
      console.warn("Failed to send join request email:", emailError.message);
      // Don't fail the mutation if email fails - the request is still valid
    }

    // Check if there's already a pending request for this user+family combination
    const existingRequest = await FamilyJoinRequest.findOne({
      userId: auth.user._id,
      familyId: familyId,
      status: "PENDING",
      isActive: true,
    });

    if (existingRequest) {
      throw new GraphQLError(
        "You already have a pending request for this family",
        {
          extensions: { code: ERROR_CODES.DUPLICATE_FAMILY_REQUEST },
        }
      );
    }

    // Create the join request record
    await FamilyJoinRequest.create({
      userId: auth.user._id,
      familyId: familyId,
      ownerId: family.ownerId._id,
      status: "PENDING",
      message: "", // Can be extended to accept message from args
      requestedAt: new Date(),
      isActive: true,
    });

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    console.error("Error in requestJoinFamily:", error);
    throw new GraphQLError("Failed to send join request", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedRequestJoinFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.FAMILY_JOIN_REQUEST_FAILED,
  errorMessage: "Join request failed",
})(requestJoinFamily);

module.exports = wrappedRequestJoinFamily;
module.exports.requestJoinFamilyResolver = requestJoinFamily;
