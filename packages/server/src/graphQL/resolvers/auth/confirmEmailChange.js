const jwt = require("jsonwebtoken");
const User = require("../../../database/schemas/User");
const { withErrorHandling } = require("../error-handling");
const { blacklistToken } = require("../../../auth/redisClient");

/**
 * Confirm email change using verification token
 * This completes the email change process
 */
async function confirmEmailChange(parent, args, context) {
  const { token } = args;

  try {
    // Verify email change token
    const payload = jwt.verify(token, process.env.JWT_EMAIL_SECRET);

    if (payload.type !== "email_change") {
      throw new Error("Invalid email change token");
    }

    // Find user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current email matches the token
    if (user.email !== payload.currentEmail) {
      throw new Error(
        "Email change token is no longer valid (email already changed)"
      );
    }

    // Check if new email is still available
    const existingUser = await User.findOne({
      email: payload.newEmail,
      _id: { $ne: user._id },
    });
    if (existingUser) {
      throw new Error("Email address is no longer available");
    }

    // If user is currently authenticated, blacklist their current token for security
    if (context.auth && context.auth.token) {
      try {
        await blacklistToken(context.auth.token);
        console.log(
          `Blacklisted current token for user ${user._id} during email change`
        );
      } catch (blacklistError) {
        console.warn(
          "Failed to blacklist current token during email change:",
          blacklistError.message
        );
        // Continue with email change even if blacklist fails
      }
    }

    // Update user's email and mark as verified
    await User.findByIdAndUpdate(user._id, {
      email: payload.newEmail,
      isEmailVerified: true, // New email is automatically verified
    });

    console.log(
      `Email changed successfully for user ${user._id}: ${payload.currentEmail} -> ${payload.newEmail}`
    );

    return true;
  } catch (error) {
    console.error("Email change confirmation error:", error);

    // Handle JWT errors more gracefully
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid email change token");
    } else if (error.name === "TokenExpiredError") {
      throw new Error("Email change token has expired");
    }

    throw error;
  }
}

module.exports = withErrorHandling(
  confirmEmailChange,
  "EMAIL_CHANGE_CONFIRMATION_FAILED"
);
