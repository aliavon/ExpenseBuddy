const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../../database/schemas/User");
const { withErrorHandling } = require("../error-handling");
const {
  sendEmailChangeRequestEmail,
  sendEmailChangeConfirmationEmail,
} = require("../../../auth/emailService");

/**
 * Request email change with double verification
 * 1. Verify current password
 * 2. Send confirmation email to current email
 * 3. Send verification email to new email
 */
async function requestEmailChange(parent, args, context) {
  const { newEmail, currentPassword } = args.input;

  try {
    // Check authentication
    if (!context.auth || !context.auth.user) {
      throw new Error("Authentication required");
    }

    // Get user with password
    const user = await User.findById(context.auth.user._id).select("+password");
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Check if new email is different from current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new Error("New email must be different from current email");
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({
      email: newEmail.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (existingUser) {
      throw new Error("Email address is already in use");
    }

    // Generate email change token (contains both old and new email)
    const emailChangeToken = jwt.sign(
      {
        userId: user._id,
        currentEmail: user.email,
        newEmail: newEmail.toLowerCase(),
        type: "email_change",
      },
      process.env.JWT_EMAIL_SECRET,
      { expiresIn: "1h" }
    );

    // Send confirmation email to current email
    await sendEmailChangeRequestEmail(user.email, user.firstName, newEmail);

    // Send verification email to new email
    await sendEmailChangeConfirmationEmail(
      newEmail,
      user.firstName,
      emailChangeToken
    );

    return true;
  } catch (error) {
    console.error("Email change request error:", error);
    throw error;
  }
}

module.exports = withErrorHandling(
  requestEmailChange,
  "EMAIL_CHANGE_REQUEST_FAILED"
);
