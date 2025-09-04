const jwt = require("jsonwebtoken");

// JWT configuration
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";
const INVITATION_TOKEN_EXPIRY = process.env.JWT_INVITATION_EXPIRY || "24h";
const VERIFICATION_TOKEN_EXPIRY = process.env.JWT_VERIFICATION_EXPIRY || "24h";

/**
 * Generate access token for authenticated user
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: "expense-buddy",
    audience: "expense-buddy-app",
  });
}

/**
 * Generate refresh token for token renewal
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: "expense-buddy",
    audience: "expense-buddy-app",
  });
}

/**
 * Generate invitation token for family invites
 */
function generateInvitationToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: INVITATION_TOKEN_EXPIRY,
    issuer: "expense-buddy",
    audience: "expense-buddy-invitation",
  });
}

/**
 * Generate email verification token
 */
function generateVerificationToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: VERIFICATION_TOKEN_EXPIRY,
    issuer: "expense-buddy",
    audience: "expense-buddy-verification",
  });
}

/**
 * Generate password reset token
 */
function generatePasswordResetToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "1h", // Short expiry for security
    issuer: "expense-buddy",
    audience: "expense-buddy-password-reset",
  });
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "expense-buddy",
      audience: "expense-buddy-app",
    });
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: "expense-buddy",
      audience: "expense-buddy-app",
    });
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
}

/**
 * Verify invitation token
 */
function verifyInvitationToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "expense-buddy",
      audience: "expense-buddy-invitation",
    });
  } catch (error) {
    throw new Error(`Invalid invitation token: ${error.message}`);
  }
}

/**
 * Verify email verification token
 */
function verifyVerificationToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "expense-buddy",
      audience: "expense-buddy-verification",
    });
  } catch (error) {
    throw new Error(`Invalid verification token: ${error.message}`);
  }
}

/**
 * Verify password reset token
 */
function verifyPasswordResetToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "expense-buddy",
      audience: "expense-buddy-password-reset",
    });
  } catch (error) {
    throw new Error(`Invalid password reset token: ${error.message}`);
  }
}

/**
 * Decode token without verification (useful for extracting payload)
 */
function decodeToken(token) {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error(`Cannot decode token: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error(
      "Invalid authorization header format. Expected: Bearer <token>"
    );
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Get token payload without verification
 */
function getTokenPayload(token) {
  const decoded = decodeToken(token);
  return decoded?.payload || null;
}

/**
 * Check if token is expired (without verification)
 */
function isTokenExpired(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.payload || !decoded.payload.exp) {
      return true; // Consider invalid tokens as expired
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < currentTime;
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
}

/**
 * Get token expiry time in seconds
 */
function getTokenExpiry(token) {
  try {
    const decoded = decodeToken(token);
    return decoded?.payload?.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get remaining TTL for token in seconds
 */
function getTokenTTL(token) {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = expiry - currentTime;

    return ttl > 0 ? ttl : 0;
  } catch (error) {
    return 0;
  }
}

module.exports = {
  // Token generation
  generateAccessToken,
  generateRefreshToken,
  generateInvitationToken,
  generateVerificationToken,
  generatePasswordResetToken,

  // Token verification
  verifyAccessToken,
  verifyRefreshToken,
  verifyInvitationToken,
  verifyVerificationToken,
  verifyPasswordResetToken,

  // Token utilities
  decodeToken,
  extractTokenFromHeader,
  getTokenPayload,
  isTokenExpired,
  getTokenExpiry,
  getTokenTTL,

  // Constants for tests
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
