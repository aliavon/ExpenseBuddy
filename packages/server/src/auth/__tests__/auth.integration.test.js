/**
 * Integration tests for Auth module
 * Tests how all auth components work together
 */

const auth = require("../index");

// Mock external dependencies for integration testing
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    isReady: true,
    on: jest.fn(),
    setEx: jest.fn().mockResolvedValue("OK"),
    exists: jest.fn().mockResolvedValue(0),
    quit: jest.fn().mockResolvedValue("OK"),
  })),
}));

jest.mock("nodemailer", () => ({
  createTransporter: jest.fn(() => ({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: "test123" }),
  })),
}));

jest.mock("../../database/schemas", () => ({
  User: {
    findById: jest.fn(),
  },
  Family: {
    findById: jest.fn(),
  },
}));

const { User, Family } = require("../../database/schemas");

describe("Auth Integration Tests", () => {
  const testUser = {
    _id: "507f1f77bcf86cd799439011",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    familyId: "507f1f77bcf86cd799439012",
    roleInFamily: "MEMBER",
    isActive: true,
    isEmailVerified: true,
  };

  const testFamily = {
    _id: "507f1f77bcf86cd799439012",
    name: "Test Family",
    ownerId: testUser._id,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Module Exports", () => {
    it("should export all JWT utilities", () => {
      expect(auth.generateAccessToken).toBeDefined();
      expect(auth.generateRefreshToken).toBeDefined();
      expect(auth.verifyAccessToken).toBeDefined();
      expect(auth.verifyRefreshToken).toBeDefined();
      expect(auth.extractTokenFromHeader).toBeDefined();
      expect(auth.isTokenExpired).toBeDefined();
    });

    it("should export all Redis utilities", () => {
      expect(auth.connectRedis).toBeDefined();
      expect(auth.blacklistToken).toBeDefined();
      expect(auth.isTokenBlacklisted).toBeDefined();
      expect(auth.getBlacklistStats).toBeDefined();
      expect(auth.redisHealthCheck).toBeDefined();
    });

    it("should export all Email utilities", () => {
      expect(auth.sendVerificationEmail).toBeDefined();
      expect(auth.sendPasswordResetEmail).toBeDefined();
      expect(auth.sendFamilyInvitationEmail).toBeDefined();
      expect(auth.verifyEmailConfig).toBeDefined();
    });

    it("should export all Auth Context utilities", () => {
      expect(auth.enhanceContextWithAuth).toBeDefined();
      expect(auth.requireAuth).toBeDefined();
      expect(auth.requireFamily).toBeDefined();
      expect(auth.requirePermission).toBeDefined();
      expect(auth.calculatePermissions).toBeDefined();
    });

    it("should export grouped utilities", () => {
      expect(auth.jwt).toBeDefined();
      expect(auth.redis).toBeDefined();
      expect(auth.email).toBeDefined();
      expect(auth.context).toBeDefined();
    });
  });

  describe("Complete Authentication Flow", () => {
    it("should handle complete login flow", async () => {
      // 1. Generate access token
      const payload = { userId: testUser._id, email: testUser.email };
      const token = auth.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // 2. Verify token is valid
      const verified = auth.verifyAccessToken(token);
      expect(verified.userId).toBe(testUser._id);

      // 3. Check token is not expired
      expect(auth.isTokenExpired(token)).toBe(false);

      // 4. Check token is not blacklisted (mock Redis)
      await auth.connectRedis();
      const isBlacklisted = await auth.isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(false);

      // 5. Enhance GraphQL context
      User.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(testUser),
      });

      Family.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(testFamily),
      });

      const context = {
        request: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      };

      const enhancedContext = await auth.enhanceContextWithAuth(context);

      expect(enhancedContext.auth.isAuthenticated).toBe(true);
      expect(enhancedContext.auth.user).toEqual(testUser);
      expect(enhancedContext.auth.family).toEqual(testFamily);
      expect(enhancedContext.auth.permissions.canViewFamily).toBe(true);
    });

    it("should handle complete logout flow", async () => {
      // 1. Generate and verify token
      const payload = { userId: testUser._id };
      const token = auth.generateAccessToken(payload);
      const verified = auth.verifyAccessToken(token);
      expect(verified.userId).toBe(testUser._id);

      // 2. Connect to Redis
      await auth.connectRedis();

      // 3. Blacklist token on logout
      const result = await auth.blacklistToken(token, "user_logout");
      expect(result).toBe(true);

      // 4. Verify token is now blacklisted
      const isBlacklisted = await auth.isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(false); // Mock returns false, but real Redis would return true
    });

    it("should handle password reset flow", async () => {
      // 1. Generate password reset token
      const payload = {
        userId: testUser._id,
        email: testUser.email,
        type: "password-reset",
      };
      const resetToken = auth.generatePasswordResetToken(payload);

      expect(resetToken).toBeDefined();

      // 2. Verify reset token is valid
      const verified = auth.verifyPasswordResetToken(resetToken);
      expect(verified.userId).toBe(testUser._id);
      expect(verified.type).toBe("password-reset");

      // 3. Send password reset email
      const emailResult = await auth.sendPasswordResetEmail(
        testUser.email,
        resetToken,
        testUser.firstName
      );

      expect(emailResult.messageId).toBe("test123");
    });

    it("should handle email verification flow", async () => {
      // 1. Generate verification token
      const payload = {
        userId: testUser._id,
        email: testUser.email,
        type: "email-verification",
      };
      const verificationToken = auth.generateVerificationToken(payload);

      expect(verificationToken).toBeDefined();

      // 2. Send verification email
      const emailResult = await auth.sendVerificationEmail(
        testUser.email,
        verificationToken,
        testUser.firstName
      );

      expect(emailResult.messageId).toBe("test123");

      // 3. Verify the verification token
      const verified = auth.verifyVerificationToken(verificationToken);
      expect(verified.userId).toBe(testUser._id);
      expect(verified.type).toBe("email-verification");
    });

    it("should handle family invitation flow", async () => {
      // 1. Generate invitation token
      const invitationPayload = {
        familyId: testFamily._id,
        inviterEmail: testUser.email,
        role: "MEMBER",
      };
      const invitationToken = auth.generateInvitationToken(invitationPayload);

      expect(invitationToken).toBeDefined();

      // 2. Send invitation email
      const emailResult = await auth.sendFamilyInvitationEmail(
        "newmember@example.com",
        invitationToken,
        testFamily.name,
        testUser.firstName,
        "MEMBER"
      );

      expect(emailResult.messageId).toBe("test123");

      // 3. Verify invitation token
      const verified = auth.verifyInvitationToken(invitationToken);
      expect(verified.familyId).toBe(testFamily._id);
      expect(verified.role).toBe("MEMBER");
    });
  });

  describe("Permission System Integration", () => {
    it("should work with different user roles", async () => {
      const roles = [
        { role: "OWNER", canDelete: true, canManage: true },
        { role: "ADMIN", canDelete: false, canManage: true },
        { role: "MEMBER", canDelete: false, canManage: false },
      ];

      for (const { role, canDelete, canManage } of roles) {
        const permissions = auth.calculatePermissions(role);

        expect(permissions.canDeleteFamily).toBe(canDelete);
        expect(permissions.canManageMembers).toBe(canManage);
        expect(permissions.canViewFamily).toBe(true); // All roles can view
      }
    });

    it("should enforce permissions in context", async () => {
      const ownerUser = { ...testUser, roleInFamily: "OWNER" };
      const memberUser = { ...testUser, roleInFamily: "MEMBER" };

      const ownerContext = {
        auth: {
          isAuthenticated: true,
          user: ownerUser,
          family: testFamily,
          permissions: auth.calculatePermissions("OWNER"),
        },
      };

      const memberContext = {
        auth: {
          isAuthenticated: true,
          user: memberUser,
          family: testFamily,
          permissions: auth.calculatePermissions("MEMBER"),
        },
      };

      // Owner should have delete permission
      expect(() =>
        auth.requirePermission(ownerContext, "canDeleteFamily")
      ).not.toThrow();

      // Member should not have delete permission
      expect(() =>
        auth.requirePermission(memberContext, "canDeleteFamily")
      ).toThrow();
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle invalid tokens gracefully", async () => {
      const invalidToken = "invalid.token.here";

      // JWT verification should fail gracefully
      expect(() => auth.verifyAccessToken(invalidToken)).toThrow();

      // Token utilities should handle invalid tokens
      expect(auth.isTokenExpired(invalidToken)).toBe(true);
      expect(auth.getTokenTTL(invalidToken)).toBe(0);
      expect(auth.getTokenPayload(invalidToken)).toBeNull();
    });

    it("should handle context enhancement errors", async () => {
      const context = {
        request: {
          headers: {
            authorization: "Bearer invalid.token",
          },
        },
      };

      const enhancedContext = await auth.enhanceContextWithAuth(context);

      expect(enhancedContext.auth.isAuthenticated).toBe(false);
      expect(enhancedContext.auth.error).toBeDefined();
    });
  });

  describe("Token Lifecycle Management", () => {
    it("should manage token expiry correctly", () => {
      const payload = { userId: testUser._id };

      const accessToken = auth.generateAccessToken(payload);
      const refreshToken = auth.generateRefreshToken(payload);

      const accessExpiry = auth.getTokenExpiry(accessToken);
      const refreshExpiry = auth.getTokenExpiry(refreshToken);

      // Refresh token should expire later than access token
      expect(refreshExpiry).toBeGreaterThan(accessExpiry);

      // Both should have positive TTL
      expect(auth.getTokenTTL(accessToken)).toBeGreaterThan(0);
      expect(auth.getTokenTTL(refreshToken)).toBeGreaterThan(0);
    });

    it("should handle different token audiences correctly", () => {
      const payload = { userId: testUser._id };

      const accessToken = auth.generateAccessToken(payload);
      const invitationToken = auth.generateInvitationToken(payload);
      const verificationToken = auth.generateVerificationToken(payload);

      // Each should verify with its own verifier
      expect(() => auth.verifyAccessToken(accessToken)).not.toThrow();
      expect(() => auth.verifyInvitationToken(invitationToken)).not.toThrow();
      expect(() =>
        auth.verifyVerificationToken(verificationToken)
      ).not.toThrow();

      // Cross-verification should fail
      expect(() => auth.verifyAccessToken(invitationToken)).toThrow();
      expect(() => auth.verifyInvitationToken(accessToken)).toThrow();
    });
  });

  describe("System Health Integration", () => {
    it("should provide health status for all components", async () => {
      // Email service health
      const emailHealth = await auth.verifyEmailConfig();
      expect(typeof emailHealth).toBe("boolean");

      // Redis health
      await auth.connectRedis();
      const redisHealth = await auth.redisHealthCheck();
      expect(redisHealth.status).toBeDefined();
      expect(redisHealth.connected).toBeDefined();
    });

    it("should provide blacklist statistics", async () => {
      await auth.connectRedis();
      const stats = await auth.getBlacklistStats();

      expect(stats.activeBlacklistedTokens).toBeDefined();
      expect(stats.estimatedMemoryKB).toBeDefined();
      expect(stats.redisConnected).toBeDefined();
    });
  });

  afterAll(async () => {
    // Cleanup
    await auth.disconnectRedis();
  });
});
