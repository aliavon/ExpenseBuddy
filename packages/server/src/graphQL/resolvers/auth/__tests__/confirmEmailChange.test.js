const jwt = require("jsonwebtoken");
const confirmEmailChange = require("../confirmEmailChange");
const User = require("../../../../database/schemas/User");
const { blacklistToken } = require("../../../../auth/redisClient");

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../../../database/schemas/User");
jest.mock("../../../../auth/redisClient");

describe("confirmEmailChange", () => {
  let mockContext;
  let mockToken;
  let mockPayload;
  let mockUser;
  let consoleErrorSpy;
  let consoleLogSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Set up environment variable
    process.env.JWT_EMAIL_SECRET = "test-email-secret";

    mockToken = "valid.email.token";
    mockPayload = {
      type: "email_change",
      userId: "user123",
      currentEmail: "old@example.com",
      newEmail: "new@example.com"
    };

    mockUser = {
      _id: "user123",
      email: "old@example.com",
      isEmailVerified: false
    };

    mockContext = {
      auth: {
        token: "current-auth-token"
      }
    };

    // Default mock implementations
    jwt.verify.mockReturnValue(mockPayload);
    User.findById.mockResolvedValue(mockUser);
    User.findOne.mockResolvedValue(null); // No existing user with new email
    User.findByIdAndUpdate.mockResolvedValue(mockUser);
    blacklistToken.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    delete process.env.JWT_EMAIL_SECRET;
  });

  describe("successful email change", () => {
    it("should confirm email change successfully", async () => {
      const result = await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(result).toBe(true);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, "test-email-secret");
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        email: "new@example.com",
        isEmailVerified: true
      });
    });

    it("should check email availability correctly", async () => {
      await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "new@example.com",
        _id: { $ne: "user123" }
      });
    });

    it("should blacklist current token when authenticated", async () => {
      await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(blacklistToken).toHaveBeenCalledWith("current-auth-token");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Blacklisted current token for user user123 during email change"
      );
    });

    it("should log successful email change", async () => {
      await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Email changed successfully for user user123: old@example.com -> new@example.com"
      );
    });

    it("should work without authenticated context", async () => {
      const contextWithoutAuth = {};
      
      const result = await confirmEmailChange(null, { token: mockToken }, contextWithoutAuth);

      expect(result).toBe(true);
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    it("should work with auth context but no token", async () => {
      const contextWithoutToken = { auth: {} };
      
      const result = await confirmEmailChange(null, { token: mockToken }, contextWithoutToken);

      expect(result).toBe(true);
      expect(blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe("token validation", () => {
    it("should throw error for invalid token type", async () => {
      jwt.verify.mockReturnValue({ ...mockPayload, type: "invalid_type" });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error for missing token type", async () => {
      const payloadWithoutType = { ...mockPayload };
      delete payloadWithoutType.type;
      jwt.verify.mockReturnValue(payloadWithoutType);

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle JsonWebTokenError", async () => {
      const jwtError = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";
      jwt.verify.mockImplementation(() => { throw jwtError; });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change confirmation error:",
        jwtError
      );
    });

    it("should handle TokenExpiredError", async () => {
      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";
      jwt.verify.mockImplementation(() => { throw expiredError; });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle other JWT errors", async () => {
      const otherError = new Error("Some other JWT error");
      otherError.name = "SomeOtherJWTError";
      jwt.verify.mockImplementation(() => { throw otherError; });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });
  });

  describe("user validation", () => {
    it("should throw error when user not found", async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error when current email doesn't match", async () => {
      User.findById.mockResolvedValue({
        ...mockUser,
        email: "different@example.com"
      });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should throw error when new email is taken", async () => {
      User.findOne.mockResolvedValue({
        _id: "other-user",
        email: "new@example.com"
      });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });
  });

  describe("blacklist token handling", () => {
    it("should continue when blacklist fails", async () => {
      const blacklistError = new Error("Redis connection failed");
      blacklistToken.mockRejectedValue(blacklistError);

      const result = await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to blacklist current token during email change:",
        "Redis connection failed"
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should handle blacklist with null token", async () => {
      const contextWithNullToken = { auth: { token: null } };
      
      const result = await confirmEmailChange(null, { token: mockToken }, contextWithNullToken);

      expect(result).toBe(true);
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    it("should handle blacklist with undefined token", async () => {
      const contextWithUndefinedToken = { auth: { token: undefined } };
      
      const result = await confirmEmailChange(null, { token: mockToken }, contextWithUndefinedToken);

      expect(result).toBe(true);
      expect(blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle User.findById errors", async () => {
      const dbError = new Error("Database connection failed");
      User.findById.mockRejectedValue(dbError);

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Email change confirmation error:",
        dbError
      );
    });

    it("should handle User.findOne errors", async () => {
      const dbError = new Error("Query failed");
      User.findOne.mockRejectedValue(dbError);

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle User.findByIdAndUpdate errors", async () => {
      const updateError = new Error("Update failed");
      User.findByIdAndUpdate.mockRejectedValue(updateError);

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });
  });

  describe("edge cases", () => {
    it("should handle payload with missing fields", async () => {
      jwt.verify.mockReturnValue({
        type: "email_change",
        // Missing userId, currentEmail, newEmail
      });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow();
    });

    it("should handle user with null email", async () => {
      User.findById.mockResolvedValue({
        ...mockUser,
        email: null
      });

      await expect(
        confirmEmailChange(null, { token: mockToken }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should handle same email in payload", async () => {
      const sameEmailPayload = {
        ...mockPayload,
        currentEmail: "same@example.com",
        newEmail: "same@example.com"
      };
      jwt.verify.mockReturnValue(sameEmailPayload);
      User.findById.mockResolvedValue({
        ...mockUser,
        email: "same@example.com"
      });

      const result = await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        email: "same@example.com",
        isEmailVerified: true
      });
    });

    it("should handle empty token string", async () => {
      const emptyTokenError = new Error("Empty token");
      emptyTokenError.name = "JsonWebTokenError";
      jwt.verify.mockImplementation(() => { throw emptyTokenError; });

      await expect(
        confirmEmailChange(null, { token: "" }, mockContext)
      ).rejects.toThrow("An error occurred");
    });

    it("should verify email is set to verified after change", async () => {
      const userWithUnverifiedEmail = {
        ...mockUser,
        isEmailVerified: false
      };
      User.findById.mockResolvedValue(userWithUnverifiedEmail);

      await confirmEmailChange(null, { token: mockToken }, mockContext);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        email: "new@example.com",
        isEmailVerified: true
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex email change flow", async () => {
      // Simulate a full flow with all checks passing
      const complexPayload = {
        type: "email_change",
        userId: "complex-user-123",
        currentEmail: "complex.old@example.com",
        newEmail: "complex.new@example.com",
        iat: Date.now(),
        exp: Date.now() + 3600000
      };
      
      const complexUser = {
        _id: "complex-user-123",
        email: "complex.old@example.com",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: true
      };

      jwt.verify.mockReturnValue(complexPayload);
      User.findById.mockResolvedValue(complexUser);
      User.findOne.mockResolvedValue(null);
      User.findByIdAndUpdate.mockResolvedValue({
        ...complexUser,
        email: "complex.new@example.com"
      });

      const result = await confirmEmailChange(null, { token: "complex.token" }, mockContext);

      expect(result).toBe(true);
      expect(blacklistToken).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Email changed successfully for user complex-user-123: complex.old@example.com -> complex.new@example.com"
      );
    });
  });
});
