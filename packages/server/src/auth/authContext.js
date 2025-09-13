const { verifyAccessToken, extractTokenFromHeader } = require("./jwtUtils");
const { isTokenBlacklisted } = require("./redisClient");
const { User, Family } = require("../database/schemas");

/**
 * Auth context enhancer for GraphQL Yoga
 * Replaces Express middleware approach
 */
async function enhanceContextWithAuth(params, baseContext) {
  const { request } = params;

  // Extract token from request headers - safely handle missing headers
  const headers = request?.headers || {};
  const authHeader = headers.authorization || headers.Authorization;

  let authContext = {
    isAuthenticated: false,
    user: null,
    family: null,
    permissions: {
      canViewFamily: false,
      canEditFamily: false,
      canInviteMembers: false,
      canManageMembers: false,
      canDeleteFamily: false,
    },
  };

  // If no auth header, return unauthenticated context
  if (!authHeader) {
    return { ...baseContext, auth: authContext };
  }

  try {
    // Extract and verify token
    const token = extractTokenFromHeader(authHeader);

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new Error("Token has been revoked");
    }

    // Verify token
    const payload = verifyAccessToken(token);

    if (!payload.userId) {
      throw new Error("Invalid token payload: missing userId");
    }

    // Load user from database
    const user = await User.findById(payload.userId).lean();
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("User account is deactivated");
    }

    authContext.isAuthenticated = true;
    authContext.user = user;
    authContext.token = token;

    // Load family if user has one
    if (user.familyId) {
      const family = await Family.findById(user.familyId).lean();
      if (family && family.isActive) {
        authContext.family = family;
        authContext.permissions = calculatePermissions(user.roleInFamily);
      }
    }
  } catch (error) {
    console.warn("Auth context error:", error.message);
    // Return unauthenticated context on any auth error
    authContext = {
      isAuthenticated: false,
      user: null,
      family: null,
      permissions: {
        canViewFamily: false,
        canEditFamily: false,
        canInviteMembers: false,
        canManageMembers: false,
        canDeleteFamily: false,
      },
      error: error.message,
    };
  }

  return { ...baseContext, auth: authContext };
}

/**
 * Calculate permissions based on user role in family
 */
function calculatePermissions(role) {
  const permissions = {
    canViewFamily: false,
    canEditFamily: false,
    canInviteMembers: false,
    canManageMembers: false,
    canDeleteFamily: false,
  };

  if (!role) {
    return permissions;
  }

  switch (role.toUpperCase()) {
    case "OWNER":
      permissions.canViewFamily = true;
      permissions.canEditFamily = true;
      permissions.canInviteMembers = true;
      permissions.canManageMembers = true;
      permissions.canDeleteFamily = true;
      break;

    case "ADMIN":
      permissions.canViewFamily = true;
      permissions.canEditFamily = true;
      permissions.canInviteMembers = true;
      permissions.canManageMembers = true;
      permissions.canDeleteFamily = false;
      break;

    case "MEMBER":
      permissions.canViewFamily = true;
      permissions.canEditFamily = false;
      permissions.canInviteMembers = false;
      permissions.canManageMembers = false;
      permissions.canDeleteFamily = false;
      break;

    default:
      // Unknown role, no permissions
      break;
  }

  return permissions;
}

/**
 * Require authentication middleware
 * Throws error if user is not authenticated
 */
function requireAuth(context) {
  if (!context.auth?.isAuthenticated) {
    throw new Error("Authentication required");
  }
  return context.auth;
}

/**
 * Require family membership
 * Throws error if user is not part of a family
 */
function requireFamily(context) {
  const auth = requireAuth(context);

  if (!auth.family) {
    throw new Error("Family membership required");
  }

  return auth;
}

/**
 * Require specific permission
 */
function requirePermission(context, permission) {
  const auth = requireFamily(context);

  if (!auth.permissions[permission]) {
    throw new Error(`Permission denied: ${permission} required`);
  }

  return auth;
}

/**
 * Check if user can access specific family data
 */
function requireFamilyAccess(context, familyId) {
  const auth = requireFamily(context);

  if (auth.family._id.toString() !== familyId.toString()) {
    throw new Error("Access denied: Different family");
  }

  return auth;
}

/**
 * Check if user can access their own data or has admin rights
 */
function requireSelfOrAdmin(context, userId) {
  const auth = requireAuth(context);

  // User can access their own data
  if (userId && auth.user._id.toString() === userId.toString()) {
    return auth;
  }

  // Or must have member management permission
  if (!auth.permissions?.canManageMembers) {
    throw new Error(
      "Access denied: Can only access own data or need admin rights"
    );
  }

  return auth;
}

/**
 * Middleware to check email verification
 */
function requireEmailVerified(context) {
  const auth = requireAuth(context);

  if (!auth.user.isEmailVerified) {
    throw new Error("Email verification required");
  }

  return auth;
}

/**
 * Extract user ID from context
 */
function getUserId(context) {
  const auth = requireAuth(context);
  return auth.user._id;
}

/**
 * Extract family ID from context
 */
function getFamilyId(context) {
  const auth = requireFamily(context);
  return auth.family._id;
}

/**
 * Check if user is family owner
 */
function isOwner(context) {
  const auth = requireFamily(context);
  return auth.user.roleInFamily?.toUpperCase() === "OWNER";
}

/**
 * Check if user is admin or owner
 */
function isAdminOrOwner(context) {
  const auth = requireFamily(context);
  const role = auth.user.roleInFamily?.toUpperCase();
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Optional auth - returns auth info but doesn't throw if not authenticated
 */
function getOptionalAuth(context) {
  return context.auth || null;
}

module.exports = {
  // Main context enhancer
  enhanceContextWithAuth,

  // Permission calculation
  calculatePermissions,

  // Auth checks
  requireAuth,
  requireFamily,
  requirePermission,
  requireFamilyAccess,
  requireSelfOrAdmin,
  requireEmailVerified,

  // Utility functions
  getUserId,
  getFamilyId,
  isOwner,
  isAdminOrOwner,
  getOptionalAuth,
};
