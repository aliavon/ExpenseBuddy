const { GraphQLError } = require("graphql");
const { generateAccessToken } = require("../../../auth/jwtUtils");
const { sendVerificationEmail } = require("../../../auth/emailService");
const { User } = require("../../../database/schemas");
const {
  withValidationCurried,
  sendVerificationEmailSchema,
} = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Send verification email to user
 */
async function sendEmail(parent, args) {
  const { email } = args;

  try {
    // Find user by email (case insensitive)
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user) {
      throw new GraphQLError("User not found or account is deactivated", {
        extensions: { code: ERROR_CODES.USER_NOT_FOUND },
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return true; // Already verified, return success without sending email
    }

    // Generate verification token
    const verificationToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      type: "email_verification",
    });

    // Set expiration to 24 hours from now
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with verification token and expiration
    await User.findByIdAndUpdate(
      user._id,
      {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expirationDate,
      },
      { new: true }
    );

    // Send verification email (graceful degradation if email fails)
    try {
      await sendVerificationEmail(email, verificationToken, user.firstName);
    } catch (emailError) {
      console.warn("Failed to send verification email:", emailError.message);
      // Continue execution - token is saved in DB, user can still verify manually
    }

    return true;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle database errors
    throw new GraphQLError("Failed to send verification email", {
      extensions: { code: ERROR_CODES.SEND_VERIFICATION_EMAIL_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedSendVerificationEmail = withErrorHandlingCurried({
  errorCode: ERROR_CODES.SEND_VERIFICATION_EMAIL_FAILED,
  errorMessage: "Failed to send verification email",
})(withValidationCurried(sendVerificationEmailSchema)(sendEmail));

module.exports = wrappedSendVerificationEmail;
// Export unwrapped function for testing
module.exports.sendVerificationEmailResolver = sendEmail;
