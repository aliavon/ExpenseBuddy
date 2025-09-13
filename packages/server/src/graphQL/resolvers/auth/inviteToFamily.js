const { GraphQLError } = require("graphql");
const { sendFamilyInvitationEmail } = require("../../../auth/emailService");
const { generateAccessToken } = require("../../../auth/jwtUtils");
const { Family, User } = require("../../../database/schemas");
const { withValidationCurried, inviteToFamilySchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Invite user to family via email (requires OWNER or ADMIN role)
 */
async function inviteToFamily(parent, args, context) {
  const { input } = args;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to invite family members", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is in a family
    if (!user.familyId) {
      throw new GraphQLError("You must be a member of a family to invite others", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Prevent OWNER role invitations (only one owner per family)
    if (input.role === "OWNER") {
      throw new GraphQLError("Cannot invite users with OWNER role", {
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

    // Check if user has permission to invite (OWNER or ADMIN only)
    const isOwner = family.ownerId.toString() === user._id.toString();
    const isAdmin = user.roleInFamily === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new GraphQLError("Only family owner or admin can invite new members", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    // Normalize email
    const normalizedEmail = input.email.toLowerCase();

    // Check if user is already registered
    const existingUser = await User.findOne({ 
      email: normalizedEmail, 
      isActive: true 
    });

    if (existingUser) {
      if (existingUser.familyId) {
        if (existingUser.familyId.toString() === family._id.toString()) {
          throw new GraphQLError("This user is already a member of your family", {
            extensions: { code: ERROR_CODES.VALIDATION_ERROR },
          });
        } else {
          throw new GraphQLError("This user is already registered and in another family", {
            extensions: { code: ERROR_CODES.VALIDATION_ERROR },
          });
        }
      }
    }

    // Generate invitation token
    const invitationToken = generateAccessToken({
      inviteeEmail: normalizedEmail,
      familyId: family._id,
      familyName: family.name,
      role: input.role,
      invitedBy: user._id,
      type: "family_invitation",
    });

    // Send invitation email (graceful degradation if email fails)
    try {
      await sendFamilyInvitationEmail(
        normalizedEmail,
        invitationToken,
        family.name,
        user.email,
        input.message
      );
    } catch (emailError) {
      console.warn("Failed to send family invitation email:", emailError.message);
      // Continue execution - invitation token is generated, manual invitation possible
    }

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to send family invitation", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedInviteToFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to send family invitation",
})(withValidationCurried(inviteToFamilySchema)(inviteToFamily));

module.exports = wrappedInviteToFamily;
// Export unwrapped function for testing
module.exports.inviteToFamilyResolver = inviteToFamily;
