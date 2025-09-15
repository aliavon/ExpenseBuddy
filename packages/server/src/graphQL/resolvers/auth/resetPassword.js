const { GraphQLError } = require("graphql");
const bcrypt = require("bcryptjs");
const { verifyPasswordResetToken } = require("../../../auth/jwtUtils");
const { User } = require("../../../database/schemas");
const { withValidationCurried, resetPasswordSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");

/**
 * Reset user password with reset token
 */
async function resetPass(parent, args) {
  const { token, newPassword } = args.input;

  try {
    // Clean token from invisible characters that might be added during copy/paste
    const cleanToken = token.trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");

    // Verify JWT token
    const decodedToken = verifyPasswordResetToken(cleanToken);

    if (
      !decodedToken ||
      !decodedToken.userId ||
      decodedToken.type !== "password_reset"
    ) {
      throw new GraphQLError("Invalid password reset token", {
        extensions: { code: "PASSWORD_RESET_FAILED" },
      });
    }

    // Find user by token data
    const user = await User.findById(decodedToken.userId);

    if (!user || !user.isActive) {
      throw new GraphQLError("Invalid password reset token", {
        extensions: { code: "PASSWORD_RESET_FAILED" },
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }

    throw new GraphQLError("Password reset failed", {
      extensions: { code: "PASSWORD_RESET_FAILED" },
    });
  }
}

// Export wrapped function as default
const wrappedResetPassword = withErrorHandlingCurried({
  errorCode: "PASSWORD_RESET_FAILED",
  errorMessage: "Password reset failed",
})(withValidationCurried(resetPasswordSchema)(resetPass));

module.exports = wrappedResetPassword;
// Export unwrapped function for testing
module.exports.resetPasswordResolver = resetPass;
