const { GraphQLError } = require("graphql");
const bcrypt = require("bcryptjs");
const { generateVerificationToken } = require("../../../auth/jwtUtils");
const { sendVerificationEmail } = require("../../../auth/emailService");
const { User, Family, Currency } = require("../../../database/schemas");
const { withValidationCurried, registerSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Register a new user with email/password and family creation or joining
 */
async function register(parent, args) {
  const { input } = args;
  const {
    firstName,
    lastName,
    middleName = "",
    email,
    password,
    familyName,
    inviteCode,
    invitationToken,
  } = input;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new GraphQLError("User with this email already exists", {
      extensions: { code: ERROR_CODES.USER_EXISTS },
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  let familyId = null;
  let roleInFamily = "MEMBER";

  // Handle family logic (optional)
  if (invitationToken) {
    // TODO: Implement JWT invitation token validation
    // For now, create new family
    const defaultCurrency = await Currency.findOne({ code: "USD" });
    if (!defaultCurrency) {
      throw new GraphQLError("Default currency not found", {
        extensions: { code: ERROR_CODES.DEFAULT_CURRENCY_NOT_FOUND },
      });
    }

    const newFamily = await Family.create({
      name: familyName || `${firstName}'s Family`,
      description: "",
      ownerId: null, // Will be set after user creation
      currency: defaultCurrency._id,
      timezone: "UTC",
      isActive: true,
    });

    familyId = newFamily._id;
    roleInFamily = "OWNER";
  } else if (inviteCode) {
    // Join existing family by invite code
    const family = await Family.findOne({ inviteCode, isActive: true });
    if (!family) {
      throw new GraphQLError("Invalid or expired invite code", {
        extensions: { code: ERROR_CODES.INVALID_INVITE_CODE },
      });
    }

    familyId = family._id;
    roleInFamily = "MEMBER";
  } else if (familyName) {
    // Create new family
    const defaultCurrency = await Currency.findOne({ code: "USD" });
    if (!defaultCurrency) {
      throw new GraphQLError("Default currency not found", {
        extensions: { code: ERROR_CODES.DEFAULT_CURRENCY_NOT_FOUND },
      });
    }

    const newFamily = await Family.create({
      name: familyName,
      description: "",
      ownerId: null, // Will be set after user creation
      currency: defaultCurrency._id,
      timezone: "UTC",
      isActive: true,
    });

    familyId = newFamily._id;
    roleInFamily = "OWNER";
  }
  // If no family information provided, create user without family (familyId = null)

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    middleName,
    email: email.toLowerCase(),
    password: hashedPassword,
    familyId,
    roleInFamily,
    isEmailVerified: false,
    isVerified: false,
    isActive: true,
  });

  // Update family ownerId if user is owner
  if (roleInFamily === "OWNER" && familyId) {
    await Family.findByIdAndUpdate(familyId, { ownerId: user._id });
  }

  // Generate email verification token
  const verificationToken = generateVerificationToken({
    userId: user._id,
    email: user.email,
  });

  // Save verification token to user
  await User.findByIdAndUpdate(user._id, {
    emailVerificationToken: verificationToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email (don't block registration if it fails)
  try {
    await sendVerificationEmail(email, verificationToken, firstName);
  } catch (error) {
    console.warn("Failed to send verification email:", error.message);
    // Still return success - user can request new verification email later
  }

  return {
    success: true,
    message:
      "Registration successful! Please check your email to activate your account.",
  };
}

// Export wrapped function as default
const wrappedRegister = withErrorHandlingCurried({
  errorCode: ERROR_CODES.REGISTER_FAILED,
  errorMessage: "User registration failed",
})(withValidationCurried(registerSchema)(register));

module.exports = wrappedRegister;
// Export unwrapped function for testing
module.exports.registerResolver = register;
