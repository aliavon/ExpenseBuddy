const { GraphQLError } = require("graphql");
const { extractTokenFromHeader } = require("../../../auth/jwtUtils");
const { blacklistToken } = require("../../../auth/redisClient");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Logout user by blacklisting the current JWT token
 */
async function logout(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }

  // Extract token from request headers
  const request = context.request || context.req;
  const authHeader =
    request?.headers?.authorization || request?.headers?.Authorization;

  if (!authHeader) {
    throw new GraphQLError("No authorization header found", {
      extensions: { code: ERROR_CODES.NO_AUTH_HEADER },
    });
  }

  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    throw new GraphQLError("Invalid authorization header format", {
      extensions: { code: ERROR_CODES.INVALID_AUTH_HEADER },
    });
  }

  try {
    // Blacklist the token in Redis
    await blacklistToken(token, "user_logout");
    return true;
  } catch (error) {
    console.error("Failed to blacklist token during logout:", error);
    throw new GraphQLError("Logout failed", {
      extensions: { code: ERROR_CODES.LOGOUT_FAILED },
    });
  }
}

// Export wrapped function as default
const wrappedLogout = withErrorHandlingCurried({
  errorCode: ERROR_CODES.LOGOUT_FAILED,
  errorMessage: "User logout failed",
})(logout);

module.exports = wrappedLogout;
// Export unwrapped function for testing
module.exports.logoutResolver = logout;
