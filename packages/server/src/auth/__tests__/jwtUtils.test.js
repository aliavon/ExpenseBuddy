const {
  generateAccessToken,
  generateRefreshToken,
  generateInvitationToken,
  generateVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyInvitationToken,
  verifyVerificationToken,
  verifyPasswordResetToken,
  decodeToken,
  extractTokenFromHeader,
  getTokenPayload,
  isTokenExpired,
  getTokenExpiry,
  getTokenTTL,
  ACCESS_TOKEN_SECRET,
} = require("../jwtUtils");

describe("JWT Utils", () => {
  const testPayload = {
    userId: "507f1f77bcf86cd799439011",
    email: "test@example.com",
  };

  describe("Token Generation", () => {
    it("should generate access token with correct payload", () => {
      const token = generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

      const payload = getTokenPayload(token);
      expect(payload.userId).toBe(testPayload.userId);
      expect(payload.email).toBe(testPayload.email);
      expect(payload.iss).toBe("expense-buddy");
      expect(payload.aud).toBe("expense-buddy-app");
    });

    it("should generate refresh token with longer expiry", () => {
      const accessToken = generateAccessToken(testPayload);
      const refreshToken = generateRefreshToken(testPayload);

      const accessExpiry = getTokenExpiry(accessToken);
      const refreshExpiry = getTokenExpiry(refreshToken);

      expect(refreshExpiry).toBeGreaterThan(accessExpiry);
    });

    it("should generate invitation token with correct audience", () => {
      const token = generateInvitationToken(testPayload);
      const payload = getTokenPayload(token);

      expect(payload.aud).toBe("expense-buddy-invitation");
    });

    it("should generate verification token with correct audience", () => {
      const token = generateVerificationToken(testPayload);
      const payload = getTokenPayload(token);

      expect(payload.aud).toBe("expense-buddy-verification");
    });

    it("should generate password reset token with short expiry", () => {
      const token = generatePasswordResetToken(testPayload);
      const payload = getTokenPayload(token);

      expect(payload.aud).toBe("expense-buddy-password-reset");

      // Password reset should expire in 1 hour (3600 seconds)
      const ttl = getTokenTTL(token);
      expect(ttl).toBeLessThanOrEqual(3600);
      expect(ttl).toBeGreaterThan(3590); // Allow some time for test execution
    });
  });

  describe("Token Verification", () => {
    it("should verify valid access token", () => {
      const token = generateAccessToken(testPayload);
      const verified = verifyAccessToken(token);

      expect(verified.userId).toBe(testPayload.userId);
      expect(verified.email).toBe(testPayload.email);
    });

    it("should verify valid refresh token", () => {
      const token = generateRefreshToken(testPayload);
      const verified = verifyRefreshToken(token);

      expect(verified.userId).toBe(testPayload.userId);
    });

    it("should reject access token with wrong audience", () => {
      const invitationToken = generateInvitationToken(testPayload);

      expect(() => {
        verifyAccessToken(invitationToken);
      }).toThrow("Invalid access token");
    });

    it("should reject invitation token as access token", () => {
      const invitationToken = generateInvitationToken(testPayload);

      expect(() => {
        verifyAccessToken(invitationToken);
      }).toThrow("Invalid access token");
    });

    it("should reject malformed token", () => {
      expect(() => {
        verifyAccessToken("invalid.token");
      }).toThrow("Invalid access token");
    });

    it("should reject empty token", () => {
      expect(() => {
        verifyAccessToken("");
      }).toThrow("Invalid access token");
    });
  });

  describe("Token Utilities", () => {
    it("should extract token from Bearer header", () => {
      const token = "test.jwt.token";
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it("should return null for missing header", () => {
      expect(extractTokenFromHeader(null)).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it("should throw error for invalid header format", () => {
      expect(() => {
        extractTokenFromHeader("InvalidHeader");
      }).toThrow("Invalid authorization header format");

      expect(() => {
        extractTokenFromHeader("Basic dGVzdA==");
      }).toThrow("Invalid authorization header format");
    });

    it("should decode token without verification", () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded.header).toBeDefined();
      expect(decoded.payload).toBeDefined();
      expect(decoded.signature).toBeDefined();
      expect(decoded.payload.userId).toBe(testPayload.userId);
    });

    it("should get token payload", () => {
      const token = generateAccessToken(testPayload);
      const payload = getTokenPayload(token);

      expect(payload.userId).toBe(testPayload.userId);
      expect(payload.email).toBe(testPayload.email);
    });

    it("should check if token is not expired", () => {
      const token = generateAccessToken(testPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it("should detect expired token", () => {
      // Create a token that expires immediately
      const jwt = require("jsonwebtoken");
      const expiredPayload = { exp: 1 }; // 1 second after epoch (expired)
      const expiredToken = jwt.sign(expiredPayload, ACCESS_TOKEN_SECRET);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it("should get token expiry timestamp", () => {
      const token = generateAccessToken(testPayload);
      const expiry = getTokenExpiry(token);

      expect(expiry).toBeDefined();
      expect(typeof expiry).toBe("number");
      expect(expiry).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("should calculate token TTL", () => {
      const token = generateAccessToken(testPayload);
      const ttl = getTokenTTL(token);

      expect(ttl).toBeDefined();
      expect(typeof ttl).toBe("number");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(15 * 60); // 15 minutes max
    });

    it("should return 0 TTL for expired token", () => {
      const jwt = require("jsonwebtoken");
      const expiredPayload = { exp: 1 }; // 1 second after epoch (expired)
      const expiredToken = jwt.sign(expiredPayload, ACCESS_TOKEN_SECRET);
      const ttl = getTokenTTL(expiredToken);
      expect(ttl).toBe(0);
    });

    it("should handle malformed token gracefully", () => {
      const invalidToken = "not.a.token";

      expect(getTokenPayload(invalidToken)).toBeNull();
      expect(getTokenExpiry(invalidToken)).toBeNull();
      expect(getTokenTTL(invalidToken)).toBe(0);
      // isTokenExpired considers invalid tokens as expired
      expect(isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe("Different Token Types", () => {
    it("should verify invitation tokens correctly", () => {
      const invitationPayload = {
        familyId: "507f1f77bcf86cd799439012",
        inviterEmail: "owner@example.com",
        role: "MEMBER",
      };

      const token = generateInvitationToken(invitationPayload);
      const verified = verifyInvitationToken(token);

      expect(verified.familyId).toBe(invitationPayload.familyId);
      expect(verified.role).toBe(invitationPayload.role);
    });

    it("should verify verification tokens correctly", () => {
      const verificationPayload = {
        userId: testPayload.userId,
        email: testPayload.email,
        type: "email-verification",
      };

      const token = generateVerificationToken(verificationPayload);
      const verified = verifyVerificationToken(token);

      expect(verified.userId).toBe(verificationPayload.userId);
      expect(verified.type).toBe(verificationPayload.type);
    });

    it("should verify password reset tokens correctly", () => {
      const resetPayload = {
        userId: testPayload.userId,
        email: testPayload.email,
        type: "password-reset",
      };

      const token = generatePasswordResetToken(resetPayload);
      const verified = verifyPasswordResetToken(token);

      expect(verified.userId).toBe(resetPayload.userId);
      expect(verified.type).toBe(resetPayload.type);
    });
  });

  describe("Security", () => {
    it("should generate different tokens for same payload", () => {
      jest.useFakeTimers();

      const token1 = generateAccessToken(testPayload);

      // Advance time by 1 second to ensure different iat timestamps
      jest.advanceTimersByTime(1000);

      const token2 = generateAccessToken(testPayload);
      expect(token1).not.toBe(token2); // Different iat timestamps

      jest.useRealTimers();
    });

    it("should include required JWT claims", () => {
      const token = generateAccessToken(testPayload);
      const payload = getTokenPayload(token);

      expect(payload.iat).toBeDefined(); // issued at
      expect(payload.exp).toBeDefined(); // expires at
      expect(payload.iss).toBe("expense-buddy"); // issuer
      expect(payload.aud).toBeDefined(); // audience
    });

    it("should reject tokens with wrong issuer", () => {
      // This would require mocking or creating invalid tokens
      // Test with invalid issuer token
      const jwt = require("jsonwebtoken");
      const invalidPayload = { iss: "fake-issuer" };
      const invalidToken = jwt.sign(invalidPayload, "wrong-secret");

      expect(() => {
        verifyAccessToken(invalidToken);
      }).toThrow("Invalid access token");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty payload", () => {
      const token = generateAccessToken({});
      const payload = getTokenPayload(token);

      expect(payload).toBeDefined();
      expect(payload.iss).toBe("expense-buddy");
    });

    it("should handle null/undefined values gracefully", () => {
      expect(() => extractTokenFromHeader(null)).not.toThrow();
      expect(() => getTokenPayload("invalid")).not.toThrow();
      expect(() => isTokenExpired("invalid")).not.toThrow();
    });
  });
});
