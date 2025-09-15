const { GraphQLError } = require("graphql");
const bcrypt = require("bcryptjs");
const { User } = require("../../../database/schemas");
const {
  withValidationCurried,
  changePasswordSchema,
} = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Change user password (requires authentication)
 */
async function changePass(parent, args, context) {
  const { currentPassword, newPassword } = args.input;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to change password", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    // Find current user in database
    const user = await User.findById(context.auth.user._id);

    if (!user) {
      throw new GraphQLError("User not found", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new GraphQLError("Account is deactivated", {
        extensions: { code: ERROR_CODES.ACCOUNT_DEACTIVATED },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new GraphQLError("Current password is incorrect", {
        extensions: { code: ERROR_CODES.INCORRECT_PASSWORD },
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      throw new GraphQLError(
        "New password must be different from current password",
        {
          extensions: { code: ERROR_CODES.VALIDATION_ERROR },
        }
      );
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedNewPassword },
      { new: true }
    );

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Password change failed", {
      extensions: { code: ERROR_CODES.CHANGE_PASSWORD_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedChangePassword = withErrorHandlingCurried({
  errorCode: ERROR_CODES.CHANGE_PASSWORD_FAILED,
  errorMessage: "Password change failed",
})(withValidationCurried(changePasswordSchema)(changePass));

module.exports = wrappedChangePassword;
// Export unwrapped function for testing
module.exports.changePasswordResolver = changePass;
