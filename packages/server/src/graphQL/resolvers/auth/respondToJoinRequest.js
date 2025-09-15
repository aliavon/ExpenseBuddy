const { GraphQLError } = require("graphql");
const { FamilyJoinRequest, User } = require("../../../database/schemas");
const { sendFamilyJoinResponseEmail } = require("../../../auth/emailService");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Respond to a family join request (approve or reject)
 * Only family owners can respond to join requests for their families
 */
async function respondToJoinRequest(parent, args, context) {
  const { auth } = context;
  const { input } = args;
  const { requestId, response, message = "" } = input;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  try {
    // Find the join request with populated data
    const joinRequest = await FamilyJoinRequest.findById(requestId)
      .populate("familyId", "name ownerId")
      .populate("userId", "firstName lastName email");

    if (!joinRequest || !joinRequest.isActive) {
      throw new GraphQLError("Join request not found", {
        extensions: { code: ERROR_CODES.FAMILY_JOIN_REQUEST_NOT_FOUND },
      });
    }

    // Check if the current user is the owner of the family
    if (!joinRequest.familyId.ownerId.equals(auth.user._id)) {
      throw new GraphQLError(
        "Only family owners can respond to join requests",
        {
          extensions: { code: ERROR_CODES.UNAUTHORIZED },
        }
      );
    }

    // Check if request is still pending
    if (joinRequest.status !== "PENDING") {
      throw new GraphQLError("Join request has already been responded to", {
        extensions: { code: ERROR_CODES.REQUEST_ALREADY_PROCESSED },
      });
    }

    const newStatus = response === "APPROVE" ? "APPROVED" : "REJECTED";
    const now = new Date();

    // Update the join request
    const updatedRequest = await FamilyJoinRequest.findByIdAndUpdate(
      requestId,
      {
        status: newStatus,
        respondedAt: now,
        responseMessage: message,
      },
      { new: true }
    )
      .populate("userId", "firstName lastName email")
      .populate("familyId", "name description")
      .populate("ownerId", "firstName lastName email");

    // If approved, add user to the family
    if (response === "APPROVE") {
      await User.findByIdAndUpdate(joinRequest.userId._id, {
        familyId: joinRequest.familyId._id,
        roleInFamily: "MEMBER",
      });

      console.log(
        `User ${joinRequest.userId.email} approved to join family ${joinRequest.familyId.name}`
      );
    }

    // Send notification email to the user about the response
    try {
      const isApproved = response === "APPROVE";
      const ownerUser = await User.findById(auth.user._id).select(
        "firstName lastName"
      );
      const ownerName = `${ownerUser.firstName} ${ownerUser.lastName}`;

      await sendFamilyJoinResponseEmail(
        joinRequest.userId.email,
        joinRequest.familyId.name,
        isApproved,
        message,
        ownerName
      );
    } catch (emailError) {
      console.warn("Failed to send join response email:", emailError.message);
      // Don't fail the mutation if email fails - the response is still processed
    }

    console.log(
      `Join request ${requestId} ${newStatus.toLowerCase()} by owner ${
        auth.user.email
      }`
    );

    return updatedRequest;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    console.error("Error in respondToJoinRequest:", error);
    throw new GraphQLError("Failed to respond to join request", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function
const wrappedRespondToJoinRequest = withErrorHandlingCurried({
  errorCode: ERROR_CODES.FAMILY_JOIN_REQUEST_FAILED,
  errorMessage: "Failed to respond to join request",
})(respondToJoinRequest);

module.exports = wrappedRespondToJoinRequest;
module.exports.respondToJoinRequestResolver = respondToJoinRequest;
