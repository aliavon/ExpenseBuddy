const { GraphQLError } = require("graphql");
const { generateAccessToken } = require("../../../auth/jwtUtils");
const { sendPasswordResetEmail } = require("../../../auth/emailService");
const { User } = require("../../../database/schemas");
const {
  withValidationCurried,
  requestPasswordResetSchema,
} = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Request password reset for user
 */
async function requestReset(parent, args) {
  const { email } = args;

  try {
    // Find user by email (case insensitive)
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    // For security: Always return success to prevent email enumeration attacks
    if (!user) {
      return true; // Don't reveal if user exists or not
    }

    // Generate password reset token
    const resetToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      type: "password_reset",
    });

    // Set expiration to 1 hour from now (shorter than email verification for security)
    const expirationDate = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token and expiration
    await User.findByIdAndUpdate(
      user._id,
      {
        passwordResetToken: resetToken,
        passwordResetExpires: expirationDate,
      },
      { new: true }
    );

    // Send password reset email (graceful degradation if email fails)
    try {
      await sendPasswordResetEmail(email, resetToken, user.firstName);
    } catch (emailError) {
      console.warn("Failed to send password reset email:", emailError.message);
      // Continue execution - token is saved in DB, user can still reset if they have the token
    }

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle database errors
    throw new GraphQLError("Failed to request password reset", {
      extensions: { code: ERROR_CODES.REQUEST_PASSWORD_RESET_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedRequestPasswordReset = withErrorHandlingCurried({
  errorCode: ERROR_CODES.REQUEST_PASSWORD_RESET_FAILED,
  errorMessage: "Failed to request password reset",
})(withValidationCurried(requestPasswordResetSchema)(requestReset));

module.exports = wrappedRequestPasswordReset;
// Export unwrapped function for testing
module.exports.requestPasswordResetResolver = requestReset;
