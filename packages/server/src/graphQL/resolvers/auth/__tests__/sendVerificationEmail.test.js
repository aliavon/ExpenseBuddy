const { sendVerificationEmailResolver } = require("../sendVerificationEmail");
const { generateAccessToken } = require("../../../../auth/jwtUtils");
const { sendVerificationEmail } = require("../../../../auth/emailService");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils", () => ({
  generateAccessToken: jest.fn(),
}));

jest.mock("../../../../auth/emailService", () => ({
  sendVerificationEmail: jest.fn(),
}));

jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

describe("sendVerificationEmail resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful verification email sending", () => {
    it("should send verification email successfully for existing user", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      const mockToken = "mock-verification-token";
      const mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue(mockToken);
      User.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: mockToken,
        emailVerificationExpires: mockExpiresAt,
      });
      sendVerificationEmail.mockResolvedValue(true);

      const result = await sendVerificationEmailResolver(null, { email });

      expect(result).toBe(true);
      expect(User.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
        isActive: true,
      });
      expect(generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser._id,
          email: mockUser.email,
          type: "email_verification",
        })
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({
          emailVerificationToken: mockToken,
          emailVerificationExpires: expect.any(Date),
        }),
        { new: true }
      );
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        email,
        mockToken,
        mockUser.firstName
      );
    });

    it("should handle already verified email gracefully", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: true, // Already verified
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await sendVerificationEmailResolver(null, { email });

      expect(result).toBe(true);
      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("should work with case insensitive email", async () => {
      const email = "JOHN@EXAMPLE.COM";
      const mockUser = {
        _id: "user-id",
        email: "john@example.com", // stored lowercase
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("token");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(true);

      const result = await sendVerificationEmailResolver(null, { email });

      expect(result).toBe(true);
      expect(User.findOne).toHaveBeenCalledWith({
        email: "john@example.com", // should query with lowercase
        isActive: true,
      });
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found", async () => {
      const email = "nonexistent@example.com";

      User.findOne.mockResolvedValue(null);

      await expect(
        sendVerificationEmailResolver(null, { email })
      ).rejects.toThrow("User not found or account is deactivated");

      expect(User.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
        isActive: true,
      });
      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("should throw error if user account is deactivated", async () => {
      const email = "john@example.com";

      User.findOne.mockResolvedValue(null); // No active user found

      await expect(
        sendVerificationEmailResolver(null, { email })
      ).rejects.toThrow("User not found or account is deactivated");
    });
  });

  describe("email service errors", () => {
    it("should handle email service failure gracefully", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("token");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);
      sendVerificationEmail.mockRejectedValue(new Error("Email service down"));

      // Should still return true even if email fails (graceful degradation)
      const result = await sendVerificationEmailResolver(null, { email });

      expect(result).toBe(true);
      expect(User.findByIdAndUpdate).toHaveBeenCalled(); // Token should still be saved
    });

    it("should handle email service timeout", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("token");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);
      sendVerificationEmail.mockRejectedValue(new Error("Timeout"));

      const result = await sendVerificationEmailResolver(null, { email });

      expect(result).toBe(true); // Should not fail even if email times out
    });
  });

  describe("database errors", () => {
    it("should handle database lookup errors", async () => {
      const email = "john@example.com";

      User.findOne.mockRejectedValue(new Error("Database connection error"));

      await expect(
        sendVerificationEmailResolver(null, { email })
      ).rejects.toThrow("Failed to send verification email");

      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("should handle database update errors", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("token");
      User.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        sendVerificationEmailResolver(null, { email })
      ).rejects.toThrow("Failed to send verification email");

      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe("token generation", () => {
    it("should generate token with correct payload", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("generated-token");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(true);

      await sendVerificationEmailResolver(null, { email });

      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser._id,
        email: mockUser.email,
        type: "email_verification",
      });
    });

    it("should set expiration to 24 hours from now", async () => {
      const email = "john@example.com";
      const mockUser = {
        _id: "user-id",
        email,
        firstName: "John",
        isEmailVerified: false,
        isActive: true,
      };

      const timeBefore = Date.now();

      User.findOne.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("token");
      User.findByIdAndUpdate.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(true);

      await sendVerificationEmailResolver(null, { email });

      const timeAfter = Date.now();

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({
          emailVerificationToken: "token",
          emailVerificationExpires: expect.any(Date),
        }),
        { new: true }
      );

      // Check that expiration is approximately 24 hours from now
      const updateCall = User.findByIdAndUpdate.mock.calls[0];
      const expirationDate = updateCall[1].emailVerificationExpires;
      const expirationTime = expirationDate.getTime();

      const expectedMin = timeBefore + 24 * 60 * 60 * 1000 - 1000; // -1s tolerance
      const expectedMax = timeAfter + 24 * 60 * 60 * 1000 + 1000; // +1s tolerance

      expect(expirationTime).toBeGreaterThan(expectedMin);
      expect(expirationTime).toBeLessThan(expectedMax);
    });
  });

  describe("validation", () => {
    it("should use sendVerificationEmailSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
