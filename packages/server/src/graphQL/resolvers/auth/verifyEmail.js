const { GraphQLError } = require("graphql");
const { verifyToken } = require("../../../auth/jwtUtils");
const { User } = require("../../../database/schemas");
const { withValidationCurried, verifyEmailSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Verify user email with verification token
 */
async function verifyEmail(parent, args) {
  const { token } = args;

  try {
    // Verify JWT token
    const decodedToken = verifyToken(token, process.env.JWT_ACCESS_SECRET);

    if (!decodedToken || !decodedToken.userId) {
      throw new GraphQLError("Invalid or expired verification token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Find user with matching verification token
    const user = await User.findOne({
      _id: decodedToken.userId,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      throw new GraphQLError("Invalid or expired verification token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return true; // Already verified, return success
    }

    // Update user to mark email as verified
    await User.findByIdAndUpdate(
      user._id,
      {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      { new: true }
    );

    return true;
  } catch (error) {
    // Handle JWT errors
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw new GraphQLError("Invalid or expired verification token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle database errors
    throw new GraphQLError("Email verification failed", {
      extensions: { code: ERROR_CODES.EMAIL_VERIFICATION_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedVerifyEmail = withErrorHandlingCurried({
  errorCode: ERROR_CODES.EMAIL_VERIFICATION_FAILED,
  errorMessage: "Email verification failed",
})(withValidationCurried(verifyEmailSchema)(verifyEmail));

module.exports = wrappedVerifyEmail;
// Export unwrapped function for testing
module.exports.verifyEmailResolver = verifyEmail;
