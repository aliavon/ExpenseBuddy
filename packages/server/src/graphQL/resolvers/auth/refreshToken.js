const { GraphQLError } = require("graphql");
const {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
} = require("../../../auth/jwtUtils");
const { isTokenBlacklisted } = require("../../../auth/redisClient");
const { User } = require("../../../database/schemas");
const { withValidationCurried, refreshTokenSchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Refresh access token using refresh token
 */
async function refreshToken(parent, args) {
  const { token } = args;

  if (!token) {
    throw new GraphQLError("Refresh token is required", {
      extensions: { code: ERROR_CODES.MISSING_REFRESH_TOKEN },
    });
  }

  // Check if token is blacklisted
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) {
    throw new GraphQLError("Token has been revoked", {
      extensions: { code: ERROR_CODES.TOKEN_REVOKED },
    });
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new GraphQLError("Invalid or expired refresh token", {
      extensions: { code: ERROR_CODES.INVALID_REFRESH_TOKEN },
    });
  }

  // Find user by ID from token
  const user = await User.findOne({
    _id: decoded.userId,
    isActive: true,
  }).populate("familyId");

  if (!user) {
    throw new GraphQLError("User not found or deactivated", {
      extensions: { code: ERROR_CODES.USER_NOT_FOUND },
    });
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user,
  };
}

// Export wrapped function as default
const wrappedRefreshToken = withErrorHandlingCurried({
  errorCode: ERROR_CODES.REFRESH_TOKEN_FAILED,
  errorMessage: "Token refresh failed",
})(withValidationCurried(refreshTokenSchema)(refreshToken));

module.exports = wrappedRefreshToken;
// Export unwrapped function for testing
module.exports.refreshTokenResolver = refreshToken;
