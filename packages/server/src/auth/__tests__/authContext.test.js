const {
  enhanceContextWithAuth,
  calculatePermissions,
  requireAuth,
  requireFamily,
  requirePermission,
  requireFamilyAccess,
  requireSelfOrAdmin,
  requireEmailVerified,
  getUserId,
  getFamilyId,
  isOwner,
  isAdminOrOwner,
  getOptionalAuth,
} = require("../authContext");

// Mock dependencies
jest.mock("../jwtUtils", () => ({
  verifyAccessToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
}));

jest.mock("../redisClient", () => ({
  isTokenBlacklisted: jest.fn(),
}));

jest.mock("../../database/schemas", () => ({
  User: {
    findById: jest.fn(),
  },
  Family: {
    findById: jest.fn(),
  },
}));

const { verifyAccessToken, extractTokenFromHeader } = require("../jwtUtils");
const { isTokenBlacklisted } = require("../redisClient");
const { User, Family } = require("../../database/schemas");

describe("Auth Context", () => {
  const mockUserId = "507f1f77bcf86cd799439011";
  const mockFamilyId = "507f1f77bcf86cd799439012";

  const mockUser = {
    _id: mockUserId,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    familyId: mockFamilyId,
    roleInFamily: "MEMBER",
    isActive: true,
    isEmailVerified: true,
  };

  const mockFamily = {
    _id: mockFamilyId,
    name: "Test Family",
    ownerId: mockUserId,
    isActive: true,
  };

  const mockContext = {
    request: {
      headers: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("enhanceContextWithAuth", () => {
    it("should return unauthenticated context when no auth header", async () => {
      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.user).toBeNull();
      expect(result.auth.family).toBeNull();
    });

    it("should authenticate valid token successfully", async () => {
      const token = "valid-jwt-token";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      Family.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockFamily),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(true);
      expect(result.auth.user).toEqual(mockUser);
      expect(result.auth.family).toEqual(mockFamily);
      expect(result.auth.token).toBe(token);
    });

    it("should reject blacklisted token", async () => {
      const token = "blacklisted-token";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(true);

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.error).toBe("Token has been revoked");
    });

    it("should reject invalid token", async () => {
      const token = "invalid-token";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.error).toBe("Invalid token");
    });

    it("should reject token without userId", async () => {
      const token = "token-without-userId";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({}); // No userId

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.error).toBe("Invalid token payload: missing userId");
    });

    it("should reject non-existent user", async () => {
      const token = "token-for-deleted-user";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.error).toBe("User not found");
    });

    it("should reject inactive user", async () => {
      const token = "token-for-inactive-user";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockUser, isActive: false }),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(false);
      expect(result.auth.error).toBe("User account is deactivated");
    });

    it("should handle user without family", async () => {
      const token = "valid-token";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      const userWithoutFamily = { ...mockUser, familyId: null };

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(userWithoutFamily),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(true);
      expect(result.auth.user).toEqual(userWithoutFamily);
      expect(result.auth.family).toBeNull();
    });

    it("should handle inactive family", async () => {
      const token = "valid-token";
      mockContext.request.headers.authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      Family.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...mockFamily, isActive: false }),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(true);
      expect(result.auth.user).toEqual(mockUser);
      expect(result.auth.family).toBeNull();
    });

    it("should check Authorization header with capital A", async () => {
      const token = "valid-token";
      mockContext.request.headers.Authorization = `Bearer ${token}`;

      extractTokenFromHeader.mockReturnValue(token);
      isTokenBlacklisted.mockResolvedValue(false);
      verifyAccessToken.mockReturnValue({ userId: mockUserId });

      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await enhanceContextWithAuth(mockContext);

      expect(result.auth.isAuthenticated).toBe(true);
    });
  });

  describe("calculatePermissions", () => {
    it("should calculate OWNER permissions", () => {
      const permissions = calculatePermissions("OWNER");

      expect(permissions.canViewFamily).toBe(true);
      expect(permissions.canEditFamily).toBe(true);
      expect(permissions.canInviteMembers).toBe(true);
      expect(permissions.canManageMembers).toBe(true);
      expect(permissions.canDeleteFamily).toBe(true);
    });

    it("should calculate ADMIN permissions", () => {
      const permissions = calculatePermissions("ADMIN");

      expect(permissions.canViewFamily).toBe(true);
      expect(permissions.canEditFamily).toBe(true);
      expect(permissions.canInviteMembers).toBe(true);
      expect(permissions.canManageMembers).toBe(true);
      expect(permissions.canDeleteFamily).toBe(false);
    });

    it("should calculate MEMBER permissions", () => {
      const permissions = calculatePermissions("MEMBER");

      expect(permissions.canViewFamily).toBe(true);
      expect(permissions.canEditFamily).toBe(false);
      expect(permissions.canInviteMembers).toBe(false);
      expect(permissions.canManageMembers).toBe(false);
      expect(permissions.canDeleteFamily).toBe(false);
    });

    it("should handle unknown role", () => {
      const permissions = calculatePermissions("UNKNOWN");

      expect(permissions.canViewFamily).toBe(false);
      expect(permissions.canEditFamily).toBe(false);
      expect(permissions.canInviteMembers).toBe(false);
      expect(permissions.canManageMembers).toBe(false);
      expect(permissions.canDeleteFamily).toBe(false);
    });

    it("should handle null role", () => {
      const permissions = calculatePermissions(null);

      expect(permissions.canViewFamily).toBe(false);
      expect(permissions.canEditFamily).toBe(false);
      expect(permissions.canInviteMembers).toBe(false);
      expect(permissions.canManageMembers).toBe(false);
      expect(permissions.canDeleteFamily).toBe(false);
    });

    it("should handle case insensitive roles", () => {
      const ownerPermissions = calculatePermissions("owner");
      const adminPermissions = calculatePermissions("admin");
      const memberPermissions = calculatePermissions("member");

      expect(ownerPermissions.canDeleteFamily).toBe(true);
      expect(adminPermissions.canDeleteFamily).toBe(false);
      expect(memberPermissions.canEditFamily).toBe(false);
    });
  });

  describe("Authorization Checks", () => {
    const authenticatedContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser,
        family: mockFamily,
        permissions: calculatePermissions("MEMBER"),
      },
    };

    const unauthenticatedContext = {
      auth: {
        isAuthenticated: false,
        user: null,
        family: null,
        permissions: calculatePermissions(null),
      },
    };

    describe("requireAuth", () => {
      it("should return auth for authenticated user", () => {
        const auth = requireAuth(authenticatedContext);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should throw for unauthenticated user", () => {
        expect(() => requireAuth(unauthenticatedContext)).toThrow(
          "Authentication required"
        );
      });
    });

    describe("requireFamily", () => {
      it("should return auth for user with family", () => {
        const auth = requireFamily(authenticatedContext);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should throw for user without family", () => {
        const contextWithoutFamily = {
          auth: {
            ...authenticatedContext.auth,
            family: null,
          },
        };

        expect(() => requireFamily(contextWithoutFamily)).toThrow(
          "Family membership required"
        );
      });

      it("should throw for unauthenticated user", () => {
        expect(() => requireFamily(unauthenticatedContext)).toThrow(
          "Authentication required"
        );
      });
    });

    describe("requirePermission", () => {
      it("should return auth when permission exists", () => {
        const contextWithPermission = {
          auth: {
            ...authenticatedContext.auth,
            permissions: { canViewFamily: true },
          },
        };

        const auth = requirePermission(contextWithPermission, "canViewFamily");
        expect(auth).toBe(contextWithPermission.auth);
      });

      it("should throw when permission missing", () => {
        expect(() =>
          requirePermission(authenticatedContext, "canDeleteFamily")
        ).toThrow("Permission denied: canDeleteFamily required");
      });
    });

    describe("requireFamilyAccess", () => {
      it("should return auth for same family", () => {
        const auth = requireFamilyAccess(authenticatedContext, mockFamilyId);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should throw for different family", () => {
        const differentFamilyId = "507f1f77bcf86cd799439999";
        expect(() =>
          requireFamilyAccess(authenticatedContext, differentFamilyId)
        ).toThrow("Access denied: Different family");
      });
    });

    describe("requireSelfOrAdmin", () => {
      it("should allow access to own data", () => {
        const auth = requireSelfOrAdmin(authenticatedContext, mockUserId);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should allow admin access to other user data", () => {
        const adminContext = {
          auth: {
            ...authenticatedContext.auth,
            permissions: { canManageMembers: true },
          },
        };

        const otherUserId = "507f1f77bcf86cd799439999";
        const auth = requireSelfOrAdmin(adminContext, otherUserId);
        expect(auth).toBe(adminContext.auth);
      });

      it("should deny non-admin access to other user data", () => {
        const otherUserId = "507f1f77bcf86cd799439999";
        expect(() =>
          requireSelfOrAdmin(authenticatedContext, otherUserId)
        ).toThrow(
          "Access denied: Can only access own data or need admin rights"
        );
      });
    });

    describe("requireEmailVerified", () => {
      it("should return auth for verified user", () => {
        const auth = requireEmailVerified(authenticatedContext);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should throw for unverified user", () => {
        const unverifiedContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, isEmailVerified: false },
          },
        };

        expect(() => requireEmailVerified(unverifiedContext)).toThrow(
          "Email verification required"
        );
      });
    });
  });

  describe("Utility Functions", () => {
    const authenticatedContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser,
        family: mockFamily,
        permissions: calculatePermissions("OWNER"),
      },
    };

    describe("getUserId", () => {
      it("should return user ID", () => {
        const userId = getUserId(authenticatedContext);
        expect(userId).toBe(mockUserId);
      });

      it("should throw for unauthenticated user", () => {
        const unauthenticatedContext = { auth: { isAuthenticated: false } };
        expect(() => getUserId(unauthenticatedContext)).toThrow(
          "Authentication required"
        );
      });
    });

    describe("getFamilyId", () => {
      it("should return family ID", () => {
        const familyId = getFamilyId(authenticatedContext);
        expect(familyId).toBe(mockFamilyId);
      });

      it("should throw for user without family", () => {
        const contextWithoutFamily = {
          auth: { ...authenticatedContext.auth, family: null },
        };
        expect(() => getFamilyId(contextWithoutFamily)).toThrow(
          "Family membership required"
        );
      });
    });

    describe("isOwner", () => {
      it("should return true for OWNER", () => {
        const ownerContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "OWNER" },
          },
        };
        expect(isOwner(ownerContext)).toBe(true);
      });

      it("should return false for MEMBER", () => {
        const memberContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "MEMBER" },
          },
        };
        expect(isOwner(memberContext)).toBe(false);
      });

      it("should handle case insensitive roles", () => {
        const ownerContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "owner" },
          },
        };
        expect(isOwner(ownerContext)).toBe(true);
      });
    });

    describe("isAdminOrOwner", () => {
      it("should return true for OWNER", () => {
        const ownerContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "OWNER" },
          },
        };
        expect(isAdminOrOwner(ownerContext)).toBe(true);
      });

      it("should return true for ADMIN", () => {
        const adminContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "ADMIN" },
          },
        };
        expect(isAdminOrOwner(adminContext)).toBe(true);
      });

      it("should return false for MEMBER", () => {
        const memberContext = {
          auth: {
            ...authenticatedContext.auth,
            user: { ...mockUser, roleInFamily: "MEMBER" },
          },
        };
        expect(isAdminOrOwner(memberContext)).toBe(false);
      });
    });

    describe("getOptionalAuth", () => {
      it("should return auth when present", () => {
        const auth = getOptionalAuth(authenticatedContext);
        expect(auth).toBe(authenticatedContext.auth);
      });

      it("should return null when auth missing", () => {
        const contextWithoutAuth = {};
        const auth = getOptionalAuth(contextWithoutAuth);
        expect(auth).toBeNull();
      });
    });
  });
});
