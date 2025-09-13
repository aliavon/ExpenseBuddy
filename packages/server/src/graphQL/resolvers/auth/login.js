const { GraphQLError } = require("graphql");
const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../auth/jwtUtils");
const { User } = require("../../../database/schemas");
const { withValidationCurried, loginSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Login user with email and password
 */
async function login(parent, args) {
  const { input } = args;
  const { email, password } = input;

  // Find user by email
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  }).populate("familyId");

  if (!user) {
    throw new GraphQLError("Invalid email or password", {
      extensions: { code: ERROR_CODES.INVALID_CREDENTIALS },
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new GraphQLError("Invalid email or password", {
      extensions: { code: ERROR_CODES.INVALID_CREDENTIALS },
    });
  }

  // Check if account is deactivated
  if (!user.isActive) {
    throw new GraphQLError("Account is deactivated", {
      extensions: { code: ERROR_CODES.ACCOUNT_DEACTIVATED },
    });
  }

  // Update last login time
  user.lastLoginAt = new Date();
  await user.save();

  // Generate JWT tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user,
  };
}

// Export wrapped function as default
const wrappedLogin = withErrorHandlingCurried({
  errorCode: ERROR_CODES.LOGIN_FAILED,
  errorMessage: "User login failed",
})(withValidationCurried(loginSchema)(login));

module.exports = wrappedLogin;
// Export unwrapped function for testing
module.exports.loginResolver = login;
