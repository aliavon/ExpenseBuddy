const { GraphQLError } = require("graphql");
const bcrypt = require("bcryptjs");
const { verifyToken } = require("../../../auth/jwtUtils");
const { User } = require("../../../database/schemas");
const { withValidationCurried, resetPasswordSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Reset user password with reset token
 */
async function resetPass(parent, args) {
  const { token, newPassword } = args;

  try {
    // Verify JWT token
    const decodedToken = verifyToken(token, process.env.JWT_ACCESS_SECRET);

    if (
      !decodedToken ||
      !decodedToken.userId ||
      decodedToken.type !== "password_reset"
    ) {
      throw new GraphQLError("Invalid or expired reset token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Find user with matching reset token
    const user = await User.findOne({
      _id: decodedToken.userId,
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      throw new GraphQLError("Invalid or expired reset token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Hash the new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset tokens
    await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
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
      throw new GraphQLError("Invalid or expired reset token", {
        extensions: { code: ERROR_CODES.INVALID_TOKEN },
      });
    }

    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Password reset failed", {
      extensions: { code: ERROR_CODES.PASSWORD_RESET_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedResetPassword = withErrorHandlingCurried({
  errorCode: ERROR_CODES.PASSWORD_RESET_FAILED,
  errorMessage: "Password reset failed",
})(withValidationCurried(resetPasswordSchema)(resetPass));

module.exports = wrappedResetPassword;
// Export unwrapped function for testing
module.exports.resetPasswordResolver = resetPass;
